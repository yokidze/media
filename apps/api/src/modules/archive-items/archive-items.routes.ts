import { Router } from 'express';
import { ArchiveStatus, RoleName } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../common/async-handler.js';
import { parsePagination } from '../../common/query.js';
import { paginated } from '../../common/pagination.js';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import {
  archiveItemIdSchema,
  archiveItemByIdSchema,
  bulkArchiveActionSchema,
  createArchiveItemSchema,
  listArchiveItemsSchema,
  updateArchiveItemSchema
} from './archive-items.schemas.js';
import { buildArchiveWhere, buildOrderBy, parseArchiveFilters } from './archive-items.query.js';
import { requireCsrf } from '../../middleware/csrf.js';
import { AuditService } from '../../services/audit.service.js';
import { forbidden, notFound } from '../../common/errors.js';
import { toSlug } from '../../common/slug.js';
import { resolveContentSection } from './archive-sections.js';
import { clearFiltersOptionsCache } from '../filters/filters-cache.js';

const auditService = new AuditService(prisma);

export const archiveItemsRouter = Router();

const includeConfig = {
  category: true,
  author: true,
  tags: { include: { tag: true } },
  files: { orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }, { createdAt: 'desc' as const }] }
};

const listSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  materialType: true,
  contentSection: true,
  accessLevel: true,
  status: true,
  publicationDate: true,
  archiveYear: true,
  issueNumber: true,
  language: true,
  keywords: true,
  viewsCount: true,
  downloadsCount: true,
  createdAt: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      parentId: true
    }
  },
  author: {
    select: {
      id: true,
      fullName: true
    }
  },
  tags: {
    select: {
      tag: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  },
  files: {
    select: {
      id: true,
      fileName: true,
      originalName: true,
      mimeType: true,
      extension: true,
      sizeBytes: true,
      previewPath: true,
      isPrimary: true
    },
    orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }, { createdAt: 'desc' as const }],
    take: 1
  }
};

const canAccessItem = (roles: RoleName[] | undefined, accessLevel: 'PUBLIC' | 'STAFF_ONLY' | 'HIDDEN'): boolean => {
  if (accessLevel === 'PUBLIC') return true;
  if (accessLevel === 'STAFF_ONLY') return roles?.includes('STAFF') || roles?.includes('ADMIN') || false;
  return roles?.includes('ADMIN') || false;
};

const ensureCanManageItem = async (itemId: string, user: { id: string; roles: RoleName[] }): Promise<void> => {
  const isAdmin = user.roles.includes('ADMIN');
  if (isAdmin) return;

  const ownsItem = await prisma.archiveItem.findFirst({
    where: {
      id: itemId,
      deletedAt: null,
      createdById: user.id
    },
    select: { id: true }
  });

  if (!ownsItem) {
    throw forbidden('Teachers can manage only their own materials');
  }
};

archiveItemsRouter.get(
  '/',
  optionalAuth,
  validate(listArchiveItemsSchema),
  asyncHandler(async (req, res) => {
    const { page, pageSize, skip } = parsePagination(req.query.page, req.query.pageSize);
    const filters = parseArchiveFilters(req.query as Record<string, unknown>);
    const isAdmin = req.user?.roles.includes('ADMIN') ?? false;
    const isStaff = req.user?.roles.includes('STAFF') ?? false;

    const where = buildArchiveWhere(filters, {
      includeHidden: isAdmin,
      includeStaffOnly: isAdmin || isStaff
    });

    if (!isAdmin) {
      (where.AND as any[]).push({ status: ArchiveStatus.PUBLISHED });
    }

    const [total, items] = await prisma.$transaction([
      prisma.archiveItem.count({ where }),
      prisma.archiveItem.findMany({
        where,
        select: listSelect,
        skip,
        take: pageSize,
        orderBy: buildOrderBy(
          typeof req.query.sortBy === 'string' ? req.query.sortBy : undefined,
          req.query.sortOrder === 'asc' ? 'asc' : 'desc'
        )
      })
    ]);

    res.json(
      paginated(
        items.map((item) => ({
          ...item,
          tags: item.tags.map((entry) => entry.tag)
        })),
        {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      )
    );
  })
);

archiveItemsRouter.get(
  '/:idOrSlug',
  optionalAuth,
  validate(archiveItemByIdSchema),
  asyncHandler(async (req, res) => {
    const idOrSlug = req.params.idOrSlug;
    const item = await prisma.archiveItem.findFirst({
      where: {
        deletedAt: null,
        OR: [{ id: idOrSlug }, { slug: idOrSlug }]
      },
      include: includeConfig
    });

    if (!item) {
      throw notFound('Archive item not found');
    }

    if (!canAccessItem(req.user?.roles, item.accessLevel)) {
      throw forbidden('You do not have access to this material');
    }

    if (item.status === 'DRAFT' && !req.user?.roles.includes('ADMIN')) {
      throw forbidden('Draft is visible only for admin users');
    }

    await prisma.$transaction([
      prisma.archiveItem.update({ where: { id: item.id }, data: { viewsCount: { increment: 1 } } }),
      prisma.viewHistory.create({
        data: {
          userId: req.user?.id,
          archiveItemId: item.id,
          ipAddress: req.ip
        }
      })
    ]);

    const recommendations = await prisma.archiveItem.findMany({
      where: {
        id: { not: item.id },
        status: 'PUBLISHED',
        accessLevel: item.accessLevel === 'PUBLIC' ? 'PUBLIC' : { in: ['PUBLIC', 'STAFF_ONLY'] },
        tags: {
          some: {
            tagId: { in: item.tags.map((entry) => entry.tagId) }
          }
        }
      },
      orderBy: { viewsCount: 'desc' },
      take: 5,
      include: {
        files: { where: { isPrimary: true }, take: 1 },
        category: true
      }
    });

    res.json({
      ...item,
      tags: item.tags.map((entry) => entry.tag),
      recommendations
    });
  })
);

archiveItemsRouter.post(
  '/',
  requireAuth,
  requireRoles('ADMIN', 'STAFF'),
  requireCsrf,
  validate(createArchiveItemSchema),
  asyncHandler(async (req, res) => {
    const slug = toSlug(req.body.title);

    const item = await prisma.archiveItem.create({
      data: {
        title: req.body.title,
        slug,
        description: req.body.description,
        materialType: req.body.materialType,
        contentSection: resolveContentSection(req.body.contentSection, req.body.materialType),
        categoryId: req.body.categoryId,
        authorId: req.body.authorId,
        publicationDate: req.body.publicationDate ? new Date(req.body.publicationDate) : null,
        language: req.body.language,
        keywords: req.body.keywords,
        alphabetLetter: req.body.alphabetLetter ?? req.body.title.charAt(0).toUpperCase(),
        archiveYear: req.body.archiveYear,
        academicYear: req.body.academicYear,
        issueNumber: req.body.issueNumber,
        accessLevel: req.body.accessLevel,
        status: req.body.status,
        textContent: req.body.textContent,
        createdById: req.user?.id,
        updatedById: req.user?.id,
        tags: {
          createMany: {
            data: req.body.tags.map((tagId: string) => ({ tagId })),
            skipDuplicates: true
          }
        }
      },
      include: includeConfig
    });

    await auditService.log({
      userId: req.user?.id,
      action: 'CREATE',
      entityType: 'ARCHIVE_ITEM',
      entityId: item.id,
      metadata: { title: item.title }
    });
    clearFiltersOptionsCache();

    res.status(201).json({
      ...item,
      tags: item.tags.map((entry) => entry.tag)
    });
  })
);

archiveItemsRouter.patch(
  '/:id',
  requireAuth,
  requireRoles('ADMIN', 'STAFF'),
  requireCsrf,
  validate(updateArchiveItemSchema),
  asyncHandler(async (req, res) => {
    await ensureCanManageItem(req.params.id, req.user!);
    const { tags, ...updatePayload } = req.body;

    const item = await prisma.$transaction(async (tx) => {
      const updated = await tx.archiveItem.update({
        where: { id: req.params.id },
        data: {
          ...updatePayload,
          publicationDate: updatePayload.publicationDate ? new Date(updatePayload.publicationDate) : undefined,
          contentSection: updatePayload.contentSection
            ? updatePayload.contentSection
            : updatePayload.materialType
              ? resolveContentSection(null, updatePayload.materialType)
              : undefined,
          slug: updatePayload.title ? toSlug(updatePayload.title) : undefined,
          updatedById: req.user?.id
        },
        include: includeConfig
      });

      if (tags) {
        await tx.archiveItemTag.deleteMany({ where: { archiveItemId: req.params.id } });
        if (tags.length > 0) {
          await tx.archiveItemTag.createMany({
            data: tags.map((tagId: string) => ({ archiveItemId: req.params.id, tagId })),
            skipDuplicates: true
          });
        }
      }

      return updated;
    });

    await auditService.log({
      userId: req.user?.id,
      action: 'UPDATE',
      entityType: 'ARCHIVE_ITEM',
      entityId: item.id
    });
    clearFiltersOptionsCache();

    const reloaded = await prisma.archiveItem.findUnique({ where: { id: item.id }, include: includeConfig });

    res.json({
      ...reloaded,
      tags: reloaded?.tags.map((entry) => entry.tag)
    });
  })
);

archiveItemsRouter.delete(
  '/:id',
  requireAuth,
  requireRoles('ADMIN', 'STAFF'),
  requireCsrf,
  validate(archiveItemIdSchema),
  asyncHandler(async (req, res) => {
    await ensureCanManageItem(req.params.id, req.user!);
    await prisma.archiveItem.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });

    await auditService.log({
      userId: req.user?.id,
      action: 'DELETE',
      entityType: 'ARCHIVE_ITEM',
      entityId: req.params.id
    });
    clearFiltersOptionsCache();

    res.status(204).send();
  })
);

archiveItemsRouter.post(
  '/bulk',
  requireAuth,
  requireRoles('ADMIN'),
  requireCsrf,
  validate(bulkArchiveActionSchema),
  asyncHandler(async (req, res) => {
    const { ids, action, payload } = req.body;

    if (action === 'delete') {
      await prisma.archiveItem.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });
    }

    if (action === 'publish') {
      await prisma.archiveItem.updateMany({ where: { id: { in: ids } }, data: { status: 'PUBLISHED' } });
    }

    if (action === 'draft') {
      await prisma.archiveItem.updateMany({ where: { id: { in: ids } }, data: { status: 'DRAFT' } });
    }

    if (action === 'access' && payload?.accessLevel) {
      await prisma.archiveItem.updateMany({ where: { id: { in: ids } }, data: { accessLevel: payload.accessLevel } });
    }

    await auditService.log({
      userId: req.user?.id,
      action: 'BULK_ACTION',
      entityType: 'ARCHIVE_ITEM',
      metadata: { idsCount: ids.length, action }
    });
    clearFiltersOptionsCache();

    res.json({ success: true, affected: ids.length });
  })
);

