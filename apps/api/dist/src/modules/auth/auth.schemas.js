import { z } from 'zod';
export const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(8)
    }),
    query: z.object({}).optional().default({}),
    params: z.object({}).optional().default({})
});
export const refreshSchema = z.object({
    body: z.object({
        refreshToken: z.string().optional()
    }).optional().default({}),
    query: z.object({}).optional().default({}),
    params: z.object({}).optional().default({})
});
export const updateMeSchema = z.object({
    body: z.object({
        fullName: z.string().min(2).max(120).optional(),
        position: z.string().max(120).optional().nullable(),
        jobTitle: z.string().max(120).optional().nullable(),
        department: z.string().max(120).optional().nullable(),
        email: z.string().email().optional(),
        avatarUrl: z.string().max(500).optional().nullable(),
        profilePhotoUrl: z.string().max(500).optional().nullable(),
        phone: z.string().max(40).optional().nullable()
    }),
    query: z.object({}).optional().default({}),
    params: z.object({}).optional().default({})
});
export const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(8),
        newPassword: z.string().min(8)
    }),
    query: z.object({}).optional().default({}),
    params: z.object({}).optional().default({})
});
