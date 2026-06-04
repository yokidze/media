import { z } from 'zod';

export const searchSchema = z.object({
  query: z.object({
    q: z.string().min(2),
    page: z.coerce.number().optional(),
    pageSize: z.coerce.number().optional(),
    year: z.coerce.number().optional(),
    categoryId: z.string().uuid().optional(),
    materialType: z
      .enum(['DOCUMENT', 'ARTICLE', 'NEWSPAPER', 'BOOKLET', 'IMAGE', 'VIDEO', 'AUDIO', 'SCAN', 'OTHER'])
      .optional()
  }),
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({})
});

export const suggestionsSchema = z.object({
  query: z.object({ q: z.string().min(2) }),
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({})
});

export const autocompleteSchema = z.object({
  query: z.object({
    q: z.string().min(2),
    limit: z.coerce.number().min(5).max(8).optional().default(6)
  }),
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({})
});
