import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../common/async-handler.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { categoryIdSchema, createCategorySchema, listCategoriesSchema, updateCategorySchema } from './categories.schemas.js';
import { requireCsrf } from '../../middleware/csrf.js';
import { AuditService } from '../../services/audit.service.js';
import { toSlug } from '../../common/slug.js';
import { badRequest } from '../../common/errors.js';
import { clearFiltersOptionsCache } from '../filters/filters-cache.js';

const auditService = new AuditService(prisma);

export const categoriesRouter = Router();

categoriesRouter.get(
  '/',
  validate(listCategoriesSchema),
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const categories = await prisma.category.findMany({
      where: q ? { name: { contains: q, mode: 'insensitive' } } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        children: {
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
        }
      }
    });

    res.json(categories);
  })
);

categoriesRouter.post(
  '/',
  requireAuth,
  requireRoles('ADMIN'),
  requireCsrf,
  validate(createCategorySchema),
  asyncHandler(async (req, res) => {
    const normalizedName = req.body.name.trim();
    const normalizedSlug = req.body.slug ? toSlug(req.body.slug) : toSlug(normalizedName);

    const duplicate = await prisma.category.findFirst({
      where: {
        OR: [{ name: { equals: normalizedName, mode: 'insensitive' } }, { slug: normalizedSlug }]
      },
      select: { id: true }
    });

    if (duplicate) {
      throw badRequest('Category with the same name or slug already exists');
    }

    const category = await prisma.category.create({
      data: {
        name: normalizedName,
        nameRu: req.body.nameRu?.trim() || null,
        nameKaz: req.body.nameKaz?.trim() || null,
        slug: normalizedSlug,
        description: req.body.description,
        parentId: req.body.parentId ?? null,
        sortOrder: req.body.sortOrder
      }
    });

    await auditService.log({
      userId: req.user?.id,
      action: 'CREATE',
      entityType: 'CATEGORY',
      entityId: category.id
    });
    clearFiltersOptionsCache();

    res.status(201).json(category);
  })
);

categoriesRouter.patch(
  '/:id',
  requireAuth,
  requireRoles('ADMIN'),
  requireCsrf,
  validate(updateCategorySchema),
  asyncHandler(async (req, res) => {
    const nextName = typeof req.body.name === 'string' ? req.body.name.trim() : undefined;
    const nextSlug = req.body.slug ?? (nextName ? toSlug(nextName) : undefined);

    if (nextName || nextSlug) {
      const duplicate = await prisma.category.findFirst({
        where: {
          id: { not: req.params.id },
          OR: [
            ...(nextName ? [{ name: { equals: nextName, mode: 'insensitive' as const } }] : []),
            ...(nextSlug ? [{ slug: nextSlug }] : [])
          ]
        },
        select: { id: true }
      });

      if (duplicate) {
        throw badRequest('Category with the same name or slug already exists');
      }
    }

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        name: nextName,
        nameRu: typeof req.body.nameRu === 'string' ? req.body.nameRu.trim() : req.body.nameRu,
        nameKaz: typeof req.body.nameKaz === 'string' ? req.body.nameKaz.trim() : req.body.nameKaz,
        slug: nextSlug
      }
    });

    await auditService.log({
      userId: req.user?.id,
      action: 'UPDATE',
      entityType: 'CATEGORY',
      entityId: category.id
    });
    clearFiltersOptionsCache();

    res.json(category);
  })
);

categoriesRouter.delete(
  '/:id',
  requireAuth,
  requireRoles('ADMIN'),
  requireCsrf,
  validate(categoryIdSchema),
  asyncHandler(async (req, res) => {
    const inUse = await prisma.archiveItem.count({
      where: { categoryId: req.params.id, deletedAt: null }
    });

    if (inUse > 0) {
      throw badRequest('Cannot delete category used by existing materials');
    }

    await prisma.category.delete({ where: { id: req.params.id } });

    await auditService.log({
      userId: req.user?.id,
      action: 'DELETE',
      entityType: 'CATEGORY',
      entityId: req.params.id
    });
    clearFiltersOptionsCache();

    res.status(204).send();
  })
);
