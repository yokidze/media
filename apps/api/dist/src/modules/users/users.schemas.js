import { z } from 'zod';
const publicRoleSchema = z.enum(['admin', 'teacher']);
export const usersListSchema = z.object({
    query: z.object({
        page: z.coerce.number().optional(),
        pageSize: z.coerce.number().optional(),
        search: z.string().optional(),
        role: publicRoleSchema.optional(),
        status: z.enum(['active', 'blocked']).optional(),
        mustChangePassword: z.coerce.boolean().optional()
    }),
    body: z.object({}).optional().default({}),
    params: z.object({}).optional().default({})
});
export const createUserSchema = z.object({
    body: z.object({
        email: z.string().email('Укажите корректный email'),
        fullName: z.string().min(2, 'ФИО должно содержать минимум 2 символа'),
        role: publicRoleSchema,
        temporaryPassword: z.string().min(8, 'Временный пароль должен быть не короче 8 символов'),
        position: z.string().max(120).optional().nullable(),
        department: z.string().max(120).optional().nullable(),
        phone: z.string().max(40).optional().nullable(),
        avatarUrl: z.string().max(500).optional().nullable(),
        isActive: z.boolean().optional().default(true)
    }),
    query: z.object({}).optional().default({}),
    params: z.object({}).optional().default({})
});
export const updateUserSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
        fullName: z.string().min(2, 'ФИО должно содержать минимум 2 символа').optional(),
        email: z.string().email('Укажите корректный email').optional(),
        role: publicRoleSchema.optional(),
        isActive: z.boolean().optional(),
        position: z.string().max(120).optional().nullable(),
        department: z.string().max(120).optional().nullable(),
        phone: z.string().max(40).optional().nullable(),
        avatarUrl: z.string().max(500).optional().nullable()
    }),
    query: z.object({}).optional().default({})
});
export const userIdSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    query: z.object({}).optional().default({}),
    body: z.object({}).optional().default({})
});
export const resetPasswordSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
        temporaryPassword: z.string().min(8, 'Временный пароль должен быть не короче 8 символов')
    }),
    query: z.object({}).optional().default({})
});
