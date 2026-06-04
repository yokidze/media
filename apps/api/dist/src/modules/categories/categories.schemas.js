import { z } from 'zod';
export const listCategoriesSchema = z.object({
    query: z.object({
        includeChildren: z.coerce.boolean().optional(),
        q: z.string().optional()
    }),
    body: z.object({}).optional().default({}),
    params: z.object({}).optional().default({})
});
export const createCategorySchema = z.object({
    body: z.object({
        name: z.string().min(2),
        slug: z.string().min(2).optional(),
        description: z.string().optional(),
        parentId: z.string().uuid().nullable().optional(),
        sortOrder: z.number().int().optional().default(0)
    }),
    query: z.object({}).optional().default({}),
    params: z.object({}).optional().default({})
});
export const updateCategorySchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
        name: z.string().min(2).optional(),
        slug: z.string().min(2).optional(),
        description: z.string().nullable().optional(),
        parentId: z.string().uuid().nullable().optional(),
        sortOrder: z.number().int().optional()
    }),
    query: z.object({}).optional().default({})
});
export const categoryIdSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({}).optional().default({}),
    query: z.object({}).optional().default({})
});
