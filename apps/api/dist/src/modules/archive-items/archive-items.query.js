const parseList = (value) => value
    ? value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];
export const parseArchiveFilters = (query) => ({
    q: typeof query.q === 'string' ? query.q : undefined,
    alphabetLetter: typeof query.alphabetLetter === 'string' ? query.alphabetLetter : undefined,
    year: typeof query.year === 'number' ? query.year : Number(query.year) || undefined,
    dateFrom: typeof query.dateFrom === 'string' ? query.dateFrom : undefined,
    dateTo: typeof query.dateTo === 'string' ? query.dateTo : undefined,
    section: query.section === 'ARTICLE' || query.section === 'TV_STORY' || query.section === 'EVENT_PHOTO' ? query.section : undefined,
    materialTypes: parseList(typeof query.materialTypes === 'string' ? query.materialTypes : undefined),
    categoryIds: parseList(typeof query.categoryIds === 'string' ? query.categoryIds : undefined),
    authorIds: parseList(typeof query.authorIds === 'string' ? query.authorIds : undefined),
    tagIds: parseList(typeof query.tagIds === 'string' ? query.tagIds : undefined),
    language: typeof query.language === 'string' ? query.language : undefined,
    fileFormats: parseList(typeof query.fileFormats === 'string' ? query.fileFormats : undefined),
    accessLevels: parseList(typeof query.accessLevels === 'string' ? query.accessLevels : undefined),
    hasFile: typeof query.hasFile === 'boolean' ? query.hasFile : undefined,
    hasPreview: typeof query.hasPreview === 'boolean' ? query.hasPreview : undefined,
    status: query.status === 'DRAFT' || query.status === 'PUBLISHED' ? query.status : undefined
});
export const buildArchiveWhere = (filters, options) => {
    const andFilters = [{ deletedAt: null }];
    if (!options?.includeHidden) {
        andFilters.push({ accessLevel: { not: 'HIDDEN' } });
    }
    if (!options?.includeStaffOnly) {
        andFilters.push({ accessLevel: 'PUBLIC' });
    }
    if (filters.q) {
        andFilters.push({
            OR: [
                { title: { contains: filters.q, mode: 'insensitive' } },
                { description: { contains: filters.q, mode: 'insensitive' } },
                { keywords: { has: filters.q } },
                { author: { fullName: { contains: filters.q, mode: 'insensitive' } } },
                { tags: { some: { tag: { name: { contains: filters.q, mode: 'insensitive' } } } } }
            ]
        });
    }
    if (filters.alphabetLetter)
        andFilters.push({ alphabetLetter: filters.alphabetLetter.toUpperCase() });
    if (filters.year)
        andFilters.push({ archiveYear: filters.year });
    if (filters.section)
        andFilters.push({ contentSection: filters.section });
    if (filters.dateFrom || filters.dateTo) {
        andFilters.push({
            publicationDate: {
                gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
                lte: filters.dateTo ? new Date(filters.dateTo) : undefined
            }
        });
    }
    if (filters.materialTypes.length > 0)
        andFilters.push({ materialType: { in: filters.materialTypes } });
    if (filters.categoryIds.length > 0)
        andFilters.push({ categoryId: { in: filters.categoryIds } });
    if (filters.authorIds.length > 0)
        andFilters.push({ authorId: { in: filters.authorIds } });
    if (filters.language)
        andFilters.push({ language: filters.language });
    if (filters.tagIds.length > 0)
        andFilters.push({ tags: { some: { tagId: { in: filters.tagIds } } } });
    if (filters.fileFormats.length > 0)
        andFilters.push({ files: { some: { extension: { in: filters.fileFormats } } } });
    if (filters.accessLevels.length > 0)
        andFilters.push({ accessLevel: { in: filters.accessLevels } });
    if (filters.status)
        andFilters.push({ status: filters.status });
    if (filters.hasFile)
        andFilters.push({ files: { some: {} } });
    if (filters.hasPreview)
        andFilters.push({ files: { some: { previewPath: { not: null } } } });
    return { AND: andFilters };
};
export const buildOrderBy = (sortBy, sortOrder = 'desc') => {
    switch (sortBy) {
        case 'title':
            return { title: sortOrder };
        case 'popularity':
            return { viewsCount: sortOrder };
        case 'newest':
            return { createdAt: sortOrder };
        case 'date':
            return { publicationDate: sortOrder };
        default:
            return { updatedAt: 'desc' };
    }
};
