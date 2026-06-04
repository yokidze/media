import { z } from 'zod';
export const auditLogsSchema = z.object({
    query: z.object({
        page: z.coerce.number().optional(),
        pageSize: z.coerce.number().optional(),
        action: z.string().optional(),
        entityType: z.string().optional(),
        q: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional()
    }),
    params: z.object({}).optional().default({}),
    body: z.object({}).optional().default({})
});
