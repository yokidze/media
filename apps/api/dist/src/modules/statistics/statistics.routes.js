import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../common/async-handler.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
export const statisticsRouter = Router();
statisticsRouter.get('/dashboard', requireAuth, requireRoles('ADMIN'), asyncHandler(async (_req, res) => {
    const [totalItems, totalFiles, totalUsers, popularItems, latestItems, totalViews, totalDownloads] = await Promise.all([
        prisma.archiveItem.count({ where: { deletedAt: null } }),
        prisma.archiveFile.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.archiveItem.findMany({
            where: { deletedAt: null, status: 'PUBLISHED' },
            take: 5,
            orderBy: { viewsCount: 'desc' },
            select: { id: true, title: true, viewsCount: true, downloadsCount: true }
        }),
        prisma.archiveItem.findMany({
            where: { deletedAt: null },
            take: 8,
            orderBy: { createdAt: 'desc' },
            select: { id: true, title: true, createdAt: true, status: true }
        }),
        prisma.archiveItem.aggregate({ _sum: { viewsCount: true } }),
        prisma.archiveItem.aggregate({ _sum: { downloadsCount: true } })
    ]);
    res.json({
        totals: {
            items: totalItems,
            files: totalFiles,
            users: totalUsers,
            views: totalViews._sum.viewsCount ?? 0,
            downloads: totalDownloads._sum.downloadsCount ?? 0
        },
        popularItems,
        latestItems
    });
}));
