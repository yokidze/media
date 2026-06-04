import { Router } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import os from 'node:os';
import { unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { parse as parseCsv } from 'csv-parse';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../common/async-handler.js';
import { parsePagination } from '../../common/query.js';
import { paginated } from '../../common/pagination.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { requireCsrf } from '../../middleware/csrf.js';
import { auditLogsSchema } from './admin.schemas.js';
import { AuditService } from '../../services/audit.service.js';
import { toSlug } from '../../common/slug.js';
import { parseContentSection, resolveContentSection } from '../archive-items/archive-sections.js';
import { clearFiltersOptionsCache } from '../filters/filters-cache.js';
import { badRequest } from '../../common/errors.js';
const upload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, callback) => callback(null, os.tmpdir()),
        filename: (_req, _file, callback) => callback(null, `polytech-import-${Date.now()}-${randomUUID()}.csv`)
    }),
    limits: { fileSize: 10 * 1024 * 1024 }
});
const auditService = new AuditService(prisma);
const MATERIAL_TYPES = ['DOCUMENT', 'ARTICLE', 'NEWSPAPER', 'BOOKLET', 'IMAGE', 'VIDEO', 'AUDIO', 'SCAN', 'OTHER'];
const ACCESS_LEVELS = ['PUBLIC', 'STAFF_ONLY', 'HIDDEN'];
const STATUSES = ['DRAFT', 'PUBLISHED'];
const IMPORT_BATCH_SIZE = 100;
const EXPORT_BATCH_SIZE = 400;
const MAX_IMPORT_ERROR_DETAILS = 200;
const trimOptionalString = (value) => {
    if (typeof value !== 'string')
        return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};
const parseYear = (value) => {
    if (!value)
        return null;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 9999) {
        throw new Error('archiveYear must be a valid integer');
    }
    return parsed;
};
const parseDate = (value) => {
    if (!value)
        return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error('publicationDate must be a valid date');
    }
    return parsed;
};
const parseMaterialType = (value) => {
    if (!value)
        return 'DOCUMENT';
    return MATERIAL_TYPES.includes(value) ? value : 'DOCUMENT';
};
const parseAccessLevel = (value) => {
    if (!value)
        return 'PUBLIC';
    if (!ACCESS_LEVELS.includes(value)) {
        throw new Error('accessLevel must be one of PUBLIC, STAFF_ONLY, HIDDEN');
    }
    return value;
};
const parseStatus = (value) => {
    if (!value)
        return 'DRAFT';
    if (!STATUSES.includes(value)) {
        throw new Error('status must be one of DRAFT, PUBLISHED');
    }
    return value;
};
const parseKeywords = (value) => value
    ? value
        .split('|')
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];
const buildUniqueSlug = (title) => {
    const slugBase = toSlug(title) || 'material';
    return `${slugBase}-${randomUUID().slice(0, 8)}`;
};
const sanitizeCsvField = (value) => {
    let normalized = value === null || value === undefined ? '' : String(value);
    if (/^[=+\-@]/.test(normalized)) {
        normalized = `'${normalized}`;
    }
    if (/[",\n\r]/.test(normalized)) {
        normalized = `"${normalized.replaceAll('"', '""')}"`;
    }
    return normalized;
};
const writeCsvLine = async (res, line) => {
    if (res.write(line)) {
        return;
    }
    await once(res, 'drain');
};
export const adminRouter = Router();
adminRouter.use(requireAuth, requireRoles('ADMIN'));
adminRouter.get('/overview', asyncHandler(async (_req, res) => {
    const [usersTotal, usersActive, materialsTotal, publishedMaterials, draftMaterials, categoriesTotal, tagsTotal, auditLogsToday, latestActions] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.archiveItem.count({ where: { deletedAt: null } }),
        prisma.archiveItem.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
        prisma.archiveItem.count({ where: { deletedAt: null, status: 'DRAFT' } }),
        prisma.category.count(),
        prisma.tag.count(),
        prisma.auditLog.count({
            where: {
                createdAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
            }
        }),
        prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { email: true, fullName: true } } },
            take: 8
        })
    ]);
    res.json({
        totals: {
            users: usersTotal,
            usersActive,
            usersBlocked: usersTotal - usersActive,
            materials: materialsTotal,
            publishedMaterials,
            draftMaterials,
            categories: categoriesTotal,
            tags: tagsTotal,
            auditLogsToday
        },
        latestActions
    });
}));
adminRouter.get('/access-summary', asyncHandler(async (_req, res) => {
    const [admins, teachers] = await Promise.all([
        prisma.user.count({ where: { userRoles: { some: { role: { name: 'ADMIN' } } }, isActive: true } }),
        prisma.user.count({ where: { userRoles: { none: { role: { name: 'ADMIN' } } }, isActive: true } })
    ]);
    res.json({
        roles: {
            admin: {
                activeUsers: admins,
                capabilities: [
                    'Управление пользователями',
                    'Управление материалами',
                    'Управление категориями',
                    'Доступ к журналу действий',
                    'Импорт и экспорт'
                ]
            },
            teacher: {
                activeUsers: teachers,
                capabilities: ['Создание и редактирование своих материалов', 'Доступ к профилю и каталогу']
            }
        }
    });
}));
adminRouter.get('/audit-logs', validate(auditLogsSchema), asyncHandler(async (req, res) => {
    const { page, pageSize, skip } = parsePagination(req.query.page, req.query.pageSize);
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const dateFrom = typeof req.query.dateFrom === 'string' ? new Date(req.query.dateFrom) : null;
    const dateTo = typeof req.query.dateTo === 'string' ? new Date(req.query.dateTo) : null;
    const where = {
        action: typeof req.query.action === 'string' ? req.query.action : undefined,
        entityType: typeof req.query.entityType === 'string' ? req.query.entityType : undefined,
        ...(q
            ? {
                OR: [
                    { action: { contains: q, mode: 'insensitive' } },
                    { entityType: { contains: q, mode: 'insensitive' } },
                    { entityId: { contains: q, mode: 'insensitive' } },
                    {
                        user: {
                            is: {
                                OR: [
                                    { email: { contains: q, mode: 'insensitive' } },
                                    { fullName: { contains: q, mode: 'insensitive' } }
                                ]
                            }
                        }
                    }
                ]
            }
            : {}),
        ...((dateFrom || dateTo) && !Number.isNaN(dateFrom?.getTime() ?? 0) && !Number.isNaN(dateTo?.getTime() ?? 0)
            ? {
                createdAt: {
                    gte: dateFrom ?? undefined,
                    lte: dateTo ?? undefined
                }
            }
            : dateFrom && !Number.isNaN(dateFrom.getTime())
                ? { createdAt: { gte: dateFrom } }
                : dateTo && !Number.isNaN(dateTo.getTime())
                    ? { createdAt: { lte: dateTo } }
                    : {})
    };
    const [total, logs] = await prisma.$transaction([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { id: true, email: true, fullName: true } } },
            skip,
            take: pageSize
        })
    ]);
    res.json(paginated(logs, {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
    }));
}));
adminRouter.post('/import/csv', requireCsrf, upload.single('file'), asyncHandler(async (req, res) => {
    if (!req.file?.path) {
        res.status(400).json({ error: 'CSV file is required' });
        return;
    }
    const filePath = req.file.path;
    const categoryCache = new Map();
    const authorCache = new Map();
    const bufferedRows = [];
    const errors = [];
    let processedRows = 0;
    let importedRows = 0;
    let failedRows = 0;
    const processRecord = async (row, record) => {
        processedRows += 1;
        try {
            const title = trimOptionalString(record.title) ?? trimOptionalString(record.name);
            if (!title || title.length < 2) {
                throw new Error('title is required and must be at least 2 characters');
            }
            const description = trimOptionalString(record.description) ?? 'Imported from CSV';
            const categoryName = trimOptionalString(record.category);
            const authorName = trimOptionalString(record.author);
            const materialType = parseMaterialType(trimOptionalString(record.materialType));
            const accessLevel = parseAccessLevel(trimOptionalString(record.accessLevel));
            const status = parseStatus(trimOptionalString(record.status));
            const language = trimOptionalString(record.language) ?? 'ru';
            const archiveYear = parseYear(trimOptionalString(record.archiveYear));
            const publicationDate = parseDate(trimOptionalString(record.publicationDate));
            const issueNumber = trimOptionalString(record.issueNumber);
            const keywords = parseKeywords(trimOptionalString(record.keywords));
            const contentSection = resolveContentSection(parseContentSection(trimOptionalString(record.contentSection)), materialType);
            const slug = buildUniqueSlug(title);
            await prisma.$transaction(async (tx) => {
                let categoryId = null;
                if (categoryName) {
                    const categorySlug = toSlug(categoryName);
                    const cachedCategoryId = categoryCache.get(categorySlug);
                    if (cachedCategoryId) {
                        categoryId = cachedCategoryId;
                    }
                    else {
                        const category = await tx.category.upsert({
                            where: { slug: categorySlug },
                            update: {},
                            create: {
                                name: categoryName,
                                slug: categorySlug
                            },
                            select: { id: true }
                        });
                        categoryId = category.id;
                        categoryCache.set(categorySlug, category.id);
                    }
                }
                let authorId = null;
                if (authorName) {
                    const authorKey = authorName.toLowerCase();
                    const cachedAuthorId = authorCache.get(authorKey);
                    if (cachedAuthorId) {
                        authorId = cachedAuthorId;
                    }
                    else {
                        const existingAuthor = await tx.author.findFirst({
                            where: { fullName: { equals: authorName, mode: 'insensitive' } },
                            select: { id: true }
                        });
                        if (existingAuthor) {
                            authorId = existingAuthor.id;
                            authorCache.set(authorKey, existingAuthor.id);
                        }
                        else {
                            const createdAuthor = await tx.author.create({
                                data: { fullName: authorName },
                                select: { id: true }
                            });
                            authorId = createdAuthor.id;
                            authorCache.set(authorKey, createdAuthor.id);
                        }
                    }
                }
                await tx.archiveItem.create({
                    data: {
                        title,
                        slug,
                        description,
                        materialType,
                        contentSection,
                        accessLevel,
                        status,
                        language,
                        archiveYear,
                        issueNumber,
                        publicationDate,
                        keywords,
                        categoryId,
                        authorId,
                        createdById: req.user.id,
                        updatedById: req.user.id
                    }
                });
            });
            importedRows += 1;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown import error';
            failedRows += 1;
            if (errors.length < MAX_IMPORT_ERROR_DETAILS) {
                errors.push({ row, message });
            }
        }
    };
    const flushBuffer = async () => {
        if (bufferedRows.length === 0)
            return;
        for (const row of bufferedRows.splice(0, bufferedRows.length)) {
            await processRecord(row.row, row.record);
        }
    };
    try {
        const parser = parseCsv({
            columns: true,
            skip_empty_lines: true,
            trim: true,
            bom: true,
            relax_column_count: true
        });
        const stream = fs.createReadStream(filePath);
        stream.pipe(parser);
        let currentRow = 1;
        for await (const rawRow of parser) {
            currentRow += 1;
            bufferedRows.push({ row: currentRow, record: rawRow });
            if (bufferedRows.length >= IMPORT_BATCH_SIZE) {
                await flushBuffer();
            }
        }
        await flushBuffer();
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'CSV parse error';
        throw badRequest(`Invalid CSV format: ${message}`);
    }
    finally {
        await unlink(filePath).catch(() => undefined);
    }
    if (importedRows > 0) {
        clearFiltersOptionsCache();
    }
    await auditService.log({
        userId: req.user?.id,
        action: 'IMPORT_CSV',
        entityType: 'ARCHIVE_ITEM',
        metadata: {
            processedRows,
            createdCount: importedRows,
            failedCount: failedRows
        }
    });
    res.json({
        success: failedRows === 0,
        processedRows,
        imported: importedRows,
        failed: failedRows,
        errors
    });
}));
adminRouter.get('/export/archive-items', asyncHandler(async (_req, res) => {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="archive-items-${Date.now()}.csv"`);
    const header = [
        'id',
        'title',
        'slug',
        'contentSection',
        'materialType',
        'accessLevel',
        'status',
        'category',
        'author',
        'archiveYear',
        'language',
        'filesCount',
        'createdAt'
    ];
    await writeCsvLine(res, `${header.map((value) => sanitizeCsvField(value)).join(',')}\n`);
    let cursor;
    while (true) {
        const items = await prisma.archiveItem.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'asc' },
            take: EXPORT_BATCH_SIZE,
            ...(cursor
                ? {
                    cursor: { id: cursor },
                    skip: 1
                }
                : {}),
            select: {
                id: true,
                title: true,
                slug: true,
                contentSection: true,
                materialType: true,
                accessLevel: true,
                status: true,
                archiveYear: true,
                language: true,
                createdAt: true,
                category: { select: { name: true } },
                author: { select: { fullName: true } },
                _count: { select: { files: true } }
            }
        });
        if (items.length === 0) {
            break;
        }
        for (const item of items) {
            const row = [
                item.id,
                item.title,
                item.slug,
                item.contentSection,
                item.materialType,
                item.accessLevel,
                item.status,
                item.category?.name ?? '',
                item.author?.fullName ?? '',
                item.archiveYear ?? '',
                item.language,
                item._count.files,
                item.createdAt.toISOString()
            ];
            await writeCsvLine(res, `${row.map((value) => sanitizeCsvField(value)).join(',')}\n`);
        }
        cursor = items[items.length - 1]?.id;
        if (items.length < EXPORT_BATCH_SIZE) {
            break;
        }
    }
    res.end();
}));
