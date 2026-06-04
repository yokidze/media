import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../common/async-handler.js';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { requireCsrf } from '../../middleware/csrf.js';
import { validate } from '../../middleware/validate.js';
import { fileIdSchema, uploadFilesSchema } from './files.schemas.js';
import { extensionFromName, validateUploadMime } from '../../services/file-utils.js';
import { getStorageService } from '../../services/storage/index.js';
import { PreviewService } from '../../services/preview.service.js';
import { AuditService } from '../../services/audit.service.js';
import { env } from '../../config/env.js';
import { forbidden, notFound } from '../../common/errors.js';
import { clearFiltersOptionsCache } from '../filters/filters-cache.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.FILE_MAX_SIZE_MB * 1024 * 1024,
    files: 20
  }
});

const storage = getStorageService();
const previewService = new PreviewService(storage);
const auditService = new AuditService(prisma);

const canReadAccessLevel = (roles: string[] | undefined, accessLevel: 'PUBLIC' | 'STAFF_ONLY' | 'HIDDEN'): boolean => {
  if (accessLevel === 'PUBLIC') return true;
  if (accessLevel === 'STAFF_ONLY') return roles?.includes('STAFF') || roles?.includes('ADMIN') || false;
  return roles?.includes('ADMIN') || false;
};

const ensureCanManageItemFiles = async (itemId: string, user: { id: string; roles: string[] }): Promise<void> => {
  if (user.roles.includes('ADMIN')) return;

  const ownsItem = await prisma.archiveItem.findFirst({
    where: {
      id: itemId,
      deletedAt: null,
      createdById: user.id
    },
    select: { id: true }
  });

  if (!ownsItem) {
    throw forbidden('Teachers can manage files only for their own materials');
  }
};

export const archiveItemFilesRouter = Router({ mergeParams: true });

archiveItemFilesRouter.post(
  '/:itemId/files',
  requireAuth,
  requireRoles('ADMIN', 'STAFF'),
  requireCsrf,
  upload.array('files', 20),
  validate(uploadFilesSchema),
  asyncHandler(async (req, res) => {
    const files = (req.files as Express.Multer.File[]) ?? [];
    if (files.length === 0) {
      res.status(400).json({ error: 'At least one file is required' });
      return;
    }

    const item = await prisma.archiveItem.findUnique({ where: { id: req.params.itemId } });
    if (!item || item.deletedAt) {
      throw notFound('Archive item not found');
    }
    await ensureCanManageItemFiles(item.id, req.user!);

    const currentCount = await prisma.archiveFile.count({ where: { archiveItemId: item.id } });
    const primaryIndex = Number.isInteger(req.body.primaryIndex) ? Number(req.body.primaryIndex) : undefined;

    const created = [];
    for (const [index, file] of files.entries()) {
      validateUploadMime(file.mimetype);
      const extension = extensionFromName(file.originalname);
      const folder = `${new Date().getFullYear()}/${item.id}`;
      const saved = await storage.save({
        buffer: file.buffer,
        folder,
        extension,
        mimeType: file.mimetype,
        originalName: file.originalname
      });

      let previewPath: string | null = null;
      if (env.STORAGE_DRIVER === 'LOCAL') {
        try {
          previewPath = await previewService.buildImagePreview(saved.relativePath, file.mimetype);
        } catch {
          previewPath = null;
        }
      }

      const dbFile = await prisma.archiveFile.create({
        data: {
          archiveItemId: item.id,
          fileName: saved.fileName,
          originalName: file.originalname,
          relativePath: saved.relativePath,
          mimeType: file.mimetype,
          extension,
          sizeBytes: saved.sizeBytes,
          isPrimary: primaryIndex !== undefined ? primaryIndex === index : currentCount === 0 && index === 0,
          sortOrder: currentCount + index + 1,
          previewPath
        }
      });

      created.push(dbFile);
    }

    await auditService.log({
      userId: req.user?.id,
      action: 'UPLOAD_FILES',
      entityType: 'ARCHIVE_ITEM',
      entityId: item.id,
      metadata: { filesCount: files.length }
    });
    clearFiltersOptionsCache();

    res.status(201).json(created);
  })
);

export const filesRouter = Router();

filesRouter.get(
  '/:id/download',
  optionalAuth,
  validate(fileIdSchema),
  asyncHandler(async (req, res) => {
    const file = await prisma.archiveFile.findUnique({
      where: { id: req.params.id },
      include: { archiveItem: true }
    });

    if (!file || file.archiveItem.deletedAt) {
      throw notFound('File not found');
    }

    if (!canReadAccessLevel(req.user?.roles, file.archiveItem.accessLevel)) {
      throw forbidden('No access to this file');
    }

    if (file.archiveItem.status === 'DRAFT' && !req.user?.roles.includes('ADMIN')) {
      throw forbidden('Draft file is not available');
    }

    const target = await storage.getDownloadTarget(file.relativePath);

    await prisma.$transaction([
      prisma.archiveItem.update({
        where: { id: file.archiveItemId },
        data: { downloadsCount: { increment: 1 } }
      }),
      prisma.statisticsDaily.upsert({
        where: { date: new Date(new Date().toISOString().slice(0, 10)) },
        update: { totalDownloads: { increment: 1 } },
        create: {
          date: new Date(new Date().toISOString().slice(0, 10)),
          totalDownloads: 1
        }
      })
    ]);

    if (target.type === 'remote') {
      res.redirect(target.url);
      return;
    }

    res.download(target.path, file.originalName);
  })
);

filesRouter.get(
  '/:id/view',
  optionalAuth,
  validate(fileIdSchema),
  asyncHandler(async (req, res) => {
    const file = await prisma.archiveFile.findUnique({
      where: { id: req.params.id },
      include: { archiveItem: true }
    });

    if (!file || file.archiveItem.deletedAt) {
      throw notFound('File not found');
    }

    if (!canReadAccessLevel(req.user?.roles, file.archiveItem.accessLevel)) {
      throw forbidden('No access to this file');
    }

    if (file.archiveItem.status === 'DRAFT' && !req.user?.roles.includes('ADMIN')) {
      throw forbidden('Draft file is not available');
    }

    const target = await storage.getDownloadTarget(file.relativePath);

    if (target.type === 'remote') {
      res.redirect(target.url);
      return;
    }

    res.type(file.mimeType);
    res.sendFile(target.path);
  })
);

filesRouter.get(
  '/:id/preview',
  optionalAuth,
  validate(fileIdSchema),
  asyncHandler(async (req, res) => {
    const file = await prisma.archiveFile.findUnique({
      where: { id: req.params.id },
      include: { archiveItem: true }
    });

    if (!file || file.archiveItem.deletedAt || !file.previewPath) {
      throw notFound('Preview not found');
    }

    if (!canReadAccessLevel(req.user?.roles, file.archiveItem.accessLevel)) {
      throw forbidden('No access to preview');
    }

    if (file.archiveItem.status === 'DRAFT' && !req.user?.roles.includes('ADMIN')) {
      throw forbidden('Draft preview is not available');
    }

    const target = await storage.getDownloadTarget(file.previewPath);
    if (target.type === 'remote') {
      res.redirect(target.url);
      return;
    }

    res.sendFile(target.path);
  })
);

filesRouter.delete(
  '/:id',
  requireAuth,
  requireRoles('ADMIN', 'STAFF'),
  requireCsrf,
  validate(fileIdSchema),
  asyncHandler(async (req, res) => {
    const file = await prisma.archiveFile.findUnique({ where: { id: req.params.id } });
    if (!file) {
      throw notFound('File not found');
    }
    await ensureCanManageItemFiles(file.archiveItemId, req.user!);

    await storage.remove(file.relativePath);
    if (file.previewPath) {
      await storage.remove(file.previewPath);
    }

    await prisma.archiveFile.delete({ where: { id: file.id } });

    await auditService.log({
      userId: req.user?.id,
      action: 'DELETE_FILE',
      entityType: 'ARCHIVE_FILE',
      entityId: file.id,
      metadata: { archiveItemId: file.archiveItemId }
    });
    clearFiltersOptionsCache();

    res.status(204).send();
  })
);
