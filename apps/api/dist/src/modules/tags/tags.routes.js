import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../common/async-handler.js';
import { parsePagination } from '../../common/query.js';
import { paginated } from '../../common/pagination.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { requireCsrf } from '../../middleware/csrf.js';
import { validate } from '../../middleware/validate.js';
import { createTagSchema, listTagsSchema, tagIdSchema, updateTagSchema } from './tags.schemas.js';
import { AuditService } from '../../services/audit.service.js';
import { toSlug } from '../../common/slug.js';
import { clearFiltersOptionsCache } from '../filters/filters-cache.js';
const auditService = new AuditService(prisma);
export const tagsRouter = Router();
tagsRouter.get('/', validate(listTagsSchema), asyncHandler(async (req, res) => {
    const { page, pageSize, skip } = parsePagination(req.query.page, req.query.pageSize);
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const where = q ? { name: { contains: q, mode: 'insensitive' } } : {};
    const [total, tags] = await prisma.$transaction([
        prisma.tag.count({ where }),
        prisma.tag.findMany({ where, orderBy: { name: 'asc' }, skip, take: pageSize })
    ]);
    res.json(paginated(tags, {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
    }));
}));
tagsRouter.post('/', requireAuth, requireRoles('ADMIN', 'STAFF'), requireCsrf, validate(createTagSchema), asyncHandler(async (req, res) => {
    const tag = await prisma.tag.create({
        data: {
            name: req.body.name,
            slug: req.body.slug ?? toSlug(req.body.name)
        }
    });
    await auditService.log({
        userId: req.user?.id,
        action: 'CREATE',
        entityType: 'TAG',
        entityId: tag.id
    });
    clearFiltersOptionsCache();
    res.status(201).json(tag);
}));
tagsRouter.patch('/:id', requireAuth, requireRoles('ADMIN', 'STAFF'), requireCsrf, validate(updateTagSchema), asyncHandler(async (req, res) => {
    const tag = await prisma.tag.update({
        where: { id: req.params.id },
        data: {
            ...req.body,
            slug: req.body.slug ?? (req.body.name ? toSlug(req.body.name) : undefined)
        }
    });
    await auditService.log({
        userId: req.user?.id,
        action: 'UPDATE',
        entityType: 'TAG',
        entityId: tag.id
    });
    clearFiltersOptionsCache();
    res.json(tag);
}));
tagsRouter.delete('/:id', requireAuth, requireRoles('ADMIN'), requireCsrf, validate(tagIdSchema), asyncHandler(async (req, res) => {
    await prisma.tag.delete({ where: { id: req.params.id } });
    await auditService.log({
        userId: req.user?.id,
        action: 'DELETE',
        entityType: 'TAG',
        entityId: req.params.id
    });
    clearFiltersOptionsCache();
    res.status(204).send();
}));
