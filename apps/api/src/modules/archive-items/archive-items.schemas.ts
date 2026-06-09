import { z } from 'zod';

const sortByValues = ['date', 'title', 'popularity', 'newest', 'relevance'] as const;
const sortOrderValues = ['asc', 'desc'] as const;
const contentSectionValues = ['ARTICLE', 'TV_STORY', 'EVENT_PHOTO', 'METHODICAL_AUTHOR_PROGRAM'] as const;
const materialTypeValues = ['DOCUMENT', 'ARTICLE', 'NEWSPAPER', 'BOOKLET', 'UMKD', 'IMAGE', 'VIDEO', 'AUDIO', 'SCAN', 'OTHER'] as const;

export const listArchiveItemsSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    page: z.coerce.number().optional(),
    pageSize: z.coerce.number().optional(),
    sortBy: z.enum(sortByValues).optional(),
    sortOrder: z.enum(sortOrderValues).optional(),
    alphabetLetter: z.string().optional(),
    year: z.coerce.number().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    section: z.enum(contentSectionValues).optional(),
    materialTypes: z.string().optional(),
    categoryIds: z.string().optional(),
    authorIds: z.string().optional(),
    tagIds: z.string().optional(),
    language: z.string().optional(),
    fileFormats: z.string().optional(),
    accessLevels: z.string().optional(),
    hasFile: z.coerce.boolean().optional(),
    hasPreview: z.coerce.boolean().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED']).optional()
  }),
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({})
});

export const archiveItemByIdSchema = z.object({
  params: z.object({ idOrSlug: z.string().min(1) }),
  query: z.object({}).optional().default({}),
  body: z.object({}).optional().default({})
});

export const createArchiveItemSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    description: z.string().min(10),
    materialType: z.enum(materialTypeValues),
    contentSection: z.enum(contentSectionValues).optional(),
    categoryId: z.string().uuid().nullable().optional(),
    authorId: z.string().uuid().nullable().optional(),
    publicationDate: z.string().datetime().nullable().optional(),
    language: z.string().min(2).default('ru'),
    tags: z.array(z.string().uuid()).optional().default([]),
    keywords: z.array(z.string()).optional().default([]),
    alphabetLetter: z.string().max(2).nullable().optional(),
    archiveYear: z.number().int().nullable().optional(),
    academicYear: z.string().nullable().optional(),
    issueNumber: z.string().nullable().optional(),
    accessLevel: z.enum(['PUBLIC', 'STAFF_ONLY', 'HIDDEN']).default('PUBLIC'),
    status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
    textContent: z.string().nullable().optional()
  }),
  query: z.object({}).optional().default({}),
  params: z.object({}).optional().default({})
});

export const updateArchiveItemSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: createArchiveItemSchema.shape.body.partial(),
  query: z.object({}).optional().default({})
});

export const archiveItemIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});

export const bulkArchiveActionSchema = z.object({
  body: z.object({
    ids: z.array(z.string().uuid()).min(1),
    action: z.enum(['delete', 'publish', 'draft', 'access']),
    payload: z
      .object({
        accessLevel: z.enum(['PUBLIC', 'STAFF_ONLY', 'HIDDEN']).optional()
      })
      .optional()
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});
