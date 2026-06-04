import { z } from 'zod';

export const listTagsSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    page: z.coerce.number().optional(),
    pageSize: z.coerce.number().optional()
  }),
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({})
});

export const createTagSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    slug: z.string().min(2).optional()
  }),
  query: z.object({}).optional().default({}),
  params: z.object({}).optional().default({})
});

export const updateTagSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(2).optional(),
    slug: z.string().min(2).optional()
  }),
  query: z.object({}).optional().default({})
});

export const tagIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});
