import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../common/async-handler.js';
import { requireAuth } from '../../middleware/auth.js';
export const historyRouter = Router();
historyRouter.get('/', requireAuth, asyncHandler(async (req, res) => {
    const history = await prisma.viewHistory.findMany({
        where: { userId: req.user.id },
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
    res.json(history);
}));
