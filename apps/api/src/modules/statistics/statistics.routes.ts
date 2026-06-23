import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../common/async-handler.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { filterValidMaterials, getMaterialIntegritySummary } from '../../services/material-integrity.service.js';

export const statisticsRouter = Router();

statisticsRouter.get(
  '/dashboard',
  requireAuth,
  requireRoles('ADMIN'),
  asyncHandler(async (_req, res) => {
    const [integrity, totalUsers, popularItemsRaw, latestItemsRaw, totalViews, totalDownloads] = await Promise.all([
      getMaterialIntegritySummary(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.archiveItem.findMany({
        where: { deletedAt: null, status: 'PUBLISHED' },
        take: 20,
        orderBy: { viewsCount: 'desc' },
        select: { id: true, title: true, viewsCount: true, downloadsCount: true, textContent: true, files: { select: { relativePath: true } } }
      }),
      prisma.archiveItem.findMany({
        where: { deletedAt: null },
        take: 30,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, createdAt: true, status: true, textContent: true, files: { select: { relativePath: true } } }
      }),
      prisma.archiveItem.aggregate({ _sum: { viewsCount: true } }),
      prisma.archiveItem.aggregate({ _sum: { downloadsCount: true } })
    ]);

    res.json({
      totals: {
        items: integrity.totalMaterials,
        files: integrity.totalFiles,
        users: totalUsers,
        views: totalViews._sum.viewsCount ?? 0,
        downloads: totalDownloads._sum.downloadsCount ?? 0
      },
      popularItems: (await filterValidMaterials(popularItemsRaw)).slice(0, 5).map(({ textContent: _textContent, files: _files, ...item }) => item),
      latestItems: (await filterValidMaterials(latestItemsRaw)).slice(0, 8).map(({ textContent: _textContent, files: _files, ...item }) => item)
    });
  })
);
