import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../common/async-handler.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireCsrf } from '../../middleware/csrf.js';
import { validate } from '../../middleware/validate.js';
import { favoriteIdSchema, favoriteSchema } from './favorites.schemas.js';

export const favoritesRouter = Router();

favoritesRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: {
        archiveItem: {
          include: {
            files: { where: { isPrimary: true }, take: 1 },
            category: true
          }
        }
      }
    });

    res.json(favorites);
  })
);

favoritesRouter.post(
  '/',
  requireAuth,
  requireCsrf,
  validate(favoriteSchema),
  asyncHandler(async (req, res) => {
    const favorite = await prisma.favorite.upsert({
      where: {
        userId_archiveItemId: {
          userId: req.user!.id,
          archiveItemId: req.body.archiveItemId
        }
      },
      update: {},
      create: {
        userId: req.user!.id,
        archiveItemId: req.body.archiveItemId
      }
    });

    res.status(201).json(favorite);
  })
);

favoritesRouter.delete(
  '/:archiveItemId',
  requireAuth,
  requireCsrf,
  validate(favoriteIdSchema),
  asyncHandler(async (req, res) => {
    await prisma.favorite.deleteMany({
      where: {
        userId: req.user!.id,
        archiveItemId: req.params.archiveItemId
      }
    });

    res.status(204).send();
  })
);
