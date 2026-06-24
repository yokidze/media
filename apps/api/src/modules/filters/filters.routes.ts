import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../common/async-handler.js';
import { CONTENT_SECTIONS } from '../archive-items/archive-sections.js';
import { getFiltersOptionsCache, setFiltersOptionsCache } from './filters-cache.js';
import { filterValidMaterials } from '../../services/material-integrity.service.js';

export const filtersRouter = Router();

filtersRouter.get(
  '/options',
  asyncHandler(async (_req, res) => {
    const cached = getFiltersOptionsCache();
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json(cached);
      return;
    }

    const [materialCandidates, categories] = await Promise.all([
      prisma.archiveItem.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          archiveYear: true,
          authorId: true,
          language: true,
          alphabetLetter: true,
          contentSection: true,
          textContent: true,
          files: { select: { relativePath: true, extension: true } },
          tags: { select: { tagId: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.category.findMany({
        where: { slug: { not: 'methodical-recommendations-author-programs' } },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true, nameRu: true, nameKaz: true }
      })
    ]);
    const validMaterials = await filterValidMaterials(materialCandidates);
    const authorIds = Array.from(new Set(validMaterials.map((item) => item.authorId).filter((value): value is string => Boolean(value))));
    const tagIds = Array.from(new Set(validMaterials.flatMap((item) => item.tags.map((tag) => tag.tagId))));

    const [authors, tags] = await Promise.all([
      prisma.author.findMany({ where: { id: { in: authorIds } }, orderBy: { fullName: 'asc' }, select: { id: true, fullName: true } }),
      prisma.tag.findMany({ where: { id: { in: tagIds } }, orderBy: { name: 'asc' }, select: { id: true, name: true } })
    ]);

    const years = Array.from(new Set(validMaterials.map((item) => item.archiveYear).filter((year): year is number => year !== null))).sort((a, b) => b - a);
    const languages = Array.from(new Set(validMaterials.map((item) => item.language))).sort((a, b) => a.localeCompare(b));
    const letters = Array.from(new Set(validMaterials.map((item) => item.alphabetLetter).filter((letter): letter is string => typeof letter === 'string'))).sort((a, b) => a.localeCompare(b));
    const formats = Array.from(
      new Set(
        validMaterials.flatMap((item) => item.files.map((file) => file.extension))
      )
    ).sort((a, b) => a.localeCompare(b));
    const sectionCounts = validMaterials.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item.contentSection] = (accumulator[item.contentSection] ?? 0) + 1;
      return accumulator;
    }, {});

    const payload = {
      years,
      categories,
      authors,
      tags,
      languages,
      formats,
      letters,
      accessLevels: ['PUBLIC', 'STAFF_ONLY', 'HIDDEN'],
      materialTypes: ['DOCUMENT', 'ARTICLE', 'NEWSPAPER', 'BOOKLET', 'UMKD', 'METHODICAL_RECOMMENDATION_PROGRAM', 'IMAGE', 'VIDEO', 'AUDIO', 'SCAN', 'OTHER'],
      sections: [...CONTENT_SECTIONS],
      sectionCounts
    };

    setFiltersOptionsCache(payload);
    res.setHeader('X-Cache', 'MISS');
    res.json(payload);
  })
);

