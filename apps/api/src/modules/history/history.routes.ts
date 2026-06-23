import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../common/async-handler.js';
import { requireAuth } from '../../middleware/auth.js';
import { filterValidMaterials } from '../../services/material-integrity.service.js';

export const historyRouter = Router();

historyRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const history = await prisma.viewHistory.findMany({
      where: { userId: req.user!.id },
      orderBy: { viewedAt: 'desc' },
      take: 100,
      include: {
        archiveItem: {
          include: {
            files: { where: { isPrimary: true }, take: 1 },
            category: true
          }
        }
      }
    });

    const validArchiveItems = await filterValidMaterials(
      history
        .filter((entry) => entry.archiveItem && !entry.archiveItem.deletedAt)
        .map((entry) => ({
          ...entry.archiveItem,
          files: entry.archiveItem.files.map((file) => ({ ...file, relativePath: file.relativePath }))
        }))
    );

    const validIds = new Set(validArchiveItems.map((item) => item.id));
    res.json(history.filter((entry) => entry.archiveItem && validIds.has(entry.archiveItem.id)));
  })
);
