import { z } from 'zod';
export const uploadFilesSchema = z.object({
    params: z.object({ itemId: z.string().uuid() }),
    body: z.object({
        primaryIndex: z.coerce.number().optional()
    }).optional().default({}),
    query: z.object({}).optional().default({})
});
export const fileIdSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({}).optional().default({}),
    query: z.object({}).optional().default({})
});
