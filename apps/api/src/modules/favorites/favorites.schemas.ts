import { z } from 'zod';

export const favoriteSchema = z.object({
  body: z.object({ archiveItemId: z.string().uuid() }),
  query: z.object({}).optional().default({}),
  params: z.object({}).optional().default({})
});

export const favoriteIdSchema = z.object({
  params: z.object({ archiveItemId: z.string().uuid() }),
  body: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});
