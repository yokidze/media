import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../common/async-handler.js';
import { parsePagination } from '../../common/query.js';
import { validate } from '../../middleware/validate.js';
import { optionalAuth } from '../../middleware/auth.js';
import { autocompleteSchema, searchSchema, suggestionsSchema } from './search.schemas.js';
export const searchRouter = Router();
searchRouter.get('/', optionalAuth, validate(searchSchema), asyncHandler(async (req, res) => {
    const { q, year, categoryId, materialType } = req.query;
    const { page, pageSize, skip } = parsePagination(req.query.page, req.query.pageSize);
    const isAdmin = req.user?.roles.includes('ADMIN') ?? false;
    const isStaff = req.user?.roles.includes('STAFF') ?? false;
    const accessList = isAdmin ? ['PUBLIC', 'STAFF_ONLY', 'HIDDEN'] : isStaff ? ['PUBLIC', 'STAFF_ONLY'] : ['PUBLIC'];
    const conditions = ['ai."deletedAt" IS NULL'];
    const params = [String(q)];
    conditions.push(`ai."accessLevel"::text IN (${accessList.map((entry) => `'${entry}'`).join(',')})`);
    if (!isAdmin) {
        conditions.push(`ai."status" = 'PUBLISHED'`);
    }
    if (year) {
        params.push(Number(year));
        conditions.push(`ai."archiveYear" = $${params.length}`);
    }
    if (categoryId) {
        params.push(String(categoryId));
        conditions.push(`ai."categoryId" = $${params.length}`);
    }
    if (materialType) {
        params.push(String(materialType));
        conditions.push(`ai."materialType" = $${params.length}::"MaterialType"`);
    }
    params.push(skip, pageSize);
    const query = `
      SELECT
        ai."id",
        ai."slug",
        ai."title",
        ai."description",
        ai."contentSection",
        ai."materialType",
        ai."accessLevel",
        ai."archiveYear",
        ai."publicationDate",
        ai."viewsCount",
        ts_rank(ai."searchVector", websearch_to_tsquery('simple', $1)) AS rank,
        ts_headline('simple', ai."description", websearch_to_tsquery('simple', $1),
          'StartSel=<mark>,StopSel=</mark>,MaxFragments=2,MinWords=4,MaxWords=20') AS highlight,
        COUNT(*) OVER() AS total_count
      FROM "ArchiveItem" ai
      WHERE ${conditions.join(' AND ')}
        AND ai."searchVector" @@ websearch_to_tsquery('simple', $1)
      ORDER BY rank DESC, ai."viewsCount" DESC
      OFFSET $${params.length - 1}
      LIMIT $${params.length};
    `;
    const rows = await prisma.$queryRawUnsafe(query, ...params);
    const total = rows[0] ? Number(rows[0].total_count) : 0;
    res.json({
        data: rows.map((row) => ({
            id: row.id,
            slug: row.slug,
            title: row.title,
            description: row.description,
            contentSection: row.contentSection,
            materialType: row.materialType,
            accessLevel: row.accessLevel,
            archiveYear: row.archiveYear,
            publicationDate: row.publicationDate,
            viewsCount: row.viewsCount,
            rank: row.rank,
            highlight: row.highlight
        })),
        meta: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
        }
    });
}));
searchRouter.get('/autocomplete', optionalAuth, validate(autocompleteSchema), asyncHandler(async (req, res) => {
    const q = String(req.query.q).trim();
    const limit = Number(req.query.limit ?? 6);
    const isAdmin = req.user?.roles.includes('ADMIN') ?? false;
    const isStaff = req.user?.roles.includes('STAFF') ?? false;
    const accessList = isAdmin ? ['PUBLIC', 'STAFF_ONLY', 'HIDDEN'] : isStaff ? ['PUBLIC', 'STAFF_ONLY'] : ['PUBLIC'];
    const baseWhere = {
        deletedAt: null,
        accessLevel: { in: accessList },
        ...(isAdmin ? {} : { status: 'PUBLISHED' })
    };
    const itemSelect = {
        id: true,
        slug: true,
        title: true,
        contentSection: true,
        materialType: true,
        publicationDate: true,
        archiveYear: true
    };
    const startedWithTitle = await prisma.archiveItem.findMany({
        where: {
            ...baseWhere,
            title: { startsWith: q, mode: 'insensitive' }
        },
        select: itemSelect,
        orderBy: [{ viewsCount: 'desc' }, { publicationDate: 'desc' }],
        take: limit
    });
    const seen = new Set(startedWithTitle.map((item) => item.id));
    const remainingAfterStarts = limit - startedWithTitle.length;
    const titleContains = remainingAfterStarts > 0
        ? await prisma.archiveItem.findMany({
            where: {
                ...baseWhere,
                id: { notIn: Array.from(seen) },
                title: { contains: q, mode: 'insensitive' }
            },
            select: itemSelect,
            orderBy: [{ viewsCount: 'desc' }, { publicationDate: 'desc' }],
            take: remainingAfterStarts
        })
        : [];
    titleContains.forEach((item) => seen.add(item.id));
    const remainingAfterTitle = limit - startedWithTitle.length - titleContains.length;
    const extendedMatches = remainingAfterTitle > 0
        ? await prisma.archiveItem.findMany({
            where: {
                ...baseWhere,
                id: { notIn: Array.from(seen) },
                OR: [
                    { description: { contains: q, mode: 'insensitive' } },
                    { tags: { some: { tag: { name: { contains: q, mode: 'insensitive' } } } } },
                    { author: { is: { fullName: { contains: q, mode: 'insensitive' } } } }
                ]
            },
            select: itemSelect,
            orderBy: [{ viewsCount: 'desc' }, { publicationDate: 'desc' }],
            take: remainingAfterTitle
        })
        : [];
    const rows = [...startedWithTitle, ...titleContains, ...extendedMatches];
    res.json({
        query: q,
        results: rows
    });
}));
searchRouter.get('/suggestions', optionalAuth, validate(suggestionsSchema), asyncHandler(async (req, res) => {
    const q = String(req.query.q);
    const isAdmin = req.user?.roles.includes('ADMIN') ?? false;
    const isStaff = req.user?.roles.includes('STAFF') ?? false;
    const accessList = isAdmin ? ['PUBLIC', 'STAFF_ONLY', 'HIDDEN'] : isStaff ? ['PUBLIC', 'STAFF_ONLY'] : ['PUBLIC'];
    const canReadDrafts = isAdmin;
    const titleSuggestions = await prisma.$queryRawUnsafe(`
      SELECT ai."title" AS value, similarity(ai."title", $1) AS score
      FROM "ArchiveItem" ai
      WHERE ai."deletedAt" IS NULL
        AND ai."accessLevel"::text = ANY($2::text[])
        AND ($3::boolean OR ai."status" = 'PUBLISHED')
      ORDER BY similarity(ai."title", $1) DESC
      LIMIT 6;
      `, q, accessList, canReadDrafts);
    const tagSuggestions = await prisma.$queryRawUnsafe(`
      SELECT t."name" AS value, MAX(similarity(t."name", $1)) AS score
      FROM "Tag" t
      JOIN "ArchiveItemTag" ait ON ait."tagId" = t."id"
      JOIN "ArchiveItem" ai ON ai."id" = ait."archiveItemId"
      WHERE ai."deletedAt" IS NULL
        AND ai."accessLevel"::text = ANY($2::text[])
        AND ($3::boolean OR ai."status" = 'PUBLISHED')
      GROUP BY t."name"
      ORDER BY MAX(similarity(t."name", $1)) DESC
      LIMIT 4;
      `, q, accessList, canReadDrafts);
    const suggestions = [...titleSuggestions, ...tagSuggestions]
        .filter((entry) => entry.score > 0.2)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((entry) => entry.value);
    res.json({
        query: q,
        suggestions: Array.from(new Set(suggestions))
    });
}));
