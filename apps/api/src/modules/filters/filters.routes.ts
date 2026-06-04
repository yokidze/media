import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../common/async-handler.js';
import { CONTENT_SECTIONS } from '../archive-items/archive-sections.js';
import { getFiltersOptionsCache, setFiltersOptionsCache } from './filters-cache.js';

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

    const [years, categories, authors, tags, languages, formats, letters, sectionCountsRaw] = await Promise.all([
      prisma.archiveItem.findMany({
        where: { deletedAt: null },
        select: { archiveYear: true },
        distinct: ['archiveYear'],
        orderBy: { archiveYear: 'desc' }
      }),
      prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
      prisma.author.findMany({ orderBy: { fullName: 'asc' }, select: { id: true, fullName: true } }),
      prisma.tag.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
      prisma.archiveItem.findMany({
        where: { deletedAt: null },
        select: { language: true },
        distinct: ['language'],
        orderBy: { language: 'asc' }
      }),
      prisma.archiveFile.findMany({
        select: { extension: true },
        distinct: ['extension'],
        orderBy: { extension: 'asc' }
      }),
      prisma.archiveItem.findMany({
        where: { deletedAt: null, alphabetLetter: { not: null } },
        select: { alphabetLetter: true },
        distinct: ['alphabetLetter'],
        orderBy: { alphabetLetter: 'asc' }
      }),
      prisma.archiveItem.groupBy({
        by: ['contentSection'],
        where: { deletedAt: null },
        _count: { _all: true }
      })
    ]);

    const sectionCounts = Object.fromEntries(sectionCountsRaw.map((entry) => [entry.contentSection, entry._count._all]));

    const payload = {
      years: years.map((row) => row.archiveYear).filter((year): year is number => year !== null),
      categories,
      authors,
      tags,
      languages: languages.map((row) => row.language),
      formats: formats.map((row) => row.extension),
      letters: letters.map((row) => row.alphabetLetter).filter((letter): letter is string => typeof letter === 'string'),
      accessLevels: ['PUBLIC', 'STAFF_ONLY', 'HIDDEN'],
      materialTypes: ['DOCUMENT', 'ARTICLE', 'NEWSPAPER', 'BOOKLET', 'IMAGE', 'VIDEO', 'AUDIO', 'SCAN', 'OTHER'],
      sections: [...CONTENT_SECTIONS],
      sectionCounts
    };

    setFiltersOptionsCache(payload);
    res.setHeader('X-Cache', 'MISS');
    res.json(payload);
  })
);

