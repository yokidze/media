import { Router } from 'express';
import argon2 from 'argon2';
import { RoleName } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../common/async-handler.js';
import { parsePagination } from '../../common/query.js';
import { paginated } from '../../common/pagination.js';
import { badRequest, notFound } from '../../common/errors.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createUserSchema, resetPasswordSchema, updateUserSchema, userIdSchema, usersListSchema } from './users.schemas.js';
import { requireCsrf } from '../../middleware/csrf.js';
import { AuditService } from '../../services/audit.service.js';
import { hasProfileMirrorChanges, toUserMirrorUpdateData, upsertProfileMirror } from '../../services/user-profile-sync.service.js';
const auditService = new AuditService(prisma);
export const usersRouter = Router();
const mapPublicRoleToInternal = (role) => (role === 'admin' ? RoleName.ADMIN : RoleName.STAFF);
const mapInternalRolesToPublic = (roles) => (roles.includes(RoleName.ADMIN) ? 'admin' : 'teacher');
const normalizeOptional = (value) => {
    if (value === undefined)
        return undefined;
    if (value === null)
        return null;
    if (typeof value !== 'string')
        return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};
const tokenizeSearch = (value) => value
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
const ADMIN_SEARCH_TOKENS = new Set(['admin', 'админ', 'администратор']);
const TEACHER_SEARCH_TOKENS = new Set(['teacher', 'staff', 'преподаватель', 'учитель']);
const ACTIVE_SEARCH_TOKENS = new Set(['active', 'активен', 'активный']);
const BLOCKED_SEARCH_TOKENS = new Set(['blocked', 'заблокирован', 'заблок']);
const inferRoleFromSearch = (tokens) => {
    const hasAdmin = tokens.some((token) => ADMIN_SEARCH_TOKENS.has(token));
    const hasTeacher = tokens.some((token) => TEACHER_SEARCH_TOKENS.has(token));
    if (hasAdmin && !hasTeacher)
        return 'admin';
    if (!hasAdmin && hasTeacher)
        return 'teacher';
    return undefined;
};
const inferStatusFromSearch = (tokens) => {
    const hasActive = tokens.some((token) => ACTIVE_SEARCH_TOKENS.has(token));
    const hasBlocked = tokens.some((token) => BLOCKED_SEARCH_TOKENS.has(token));
    if (hasActive && !hasBlocked)
        return 'active';
    if (!hasActive && hasBlocked)
        return 'blocked';
    return undefined;
};
const toUserResponse = (user) => {
    const internalRoles = user.userRoles.map((entry) => entry.role.name);
    return {
        id: user.id,
        email: user.email,
        fullName: user.profile?.fullName ?? user.fullName,
        role: mapInternalRolesToPublic(internalRoles),
        roles: internalRoles,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
        profile: user.profile
            ? {
                id: user.profile.id,
                fullName: user.profile.fullName,
                position: user.profile.position,
                department: user.profile.department,
                phone: user.profile.phone,
                avatarUrl: user.profile.avatarUrl
            }
            : null,
        createdAt: user.createdAt
    };
};
usersRouter.get('/', requireAuth, requireRoles('ADMIN'), validate(usersListSchema), asyncHandler(async (req, res) => {
    const { page, pageSize, skip } = parsePagination(req.query.page, req.query.pageSize);
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const searchTokens = tokenizeSearch(search);
    const requestedRole = req.query.role === 'admin' || req.query.role === 'teacher' ? req.query.role : inferRoleFromSearch(searchTokens);
    const requestedStatus = req.query.status === 'active' || req.query.status === 'blocked' ? req.query.status : inferStatusFromSearch(searchTokens);
    const requestedMustChangePassword = typeof req.query.mustChangePassword === 'boolean' ? req.query.mustChangePassword : undefined;
    const roleWhere = requestedRole === 'admin'
        ? { userRoles: { some: { role: { name: 'ADMIN' } } } }
        : requestedRole === 'teacher'
            ? { userRoles: { none: { role: { name: 'ADMIN' } } } }
            : {};
    const where = {
        ...(search
            ? {
                AND: [
                    {
                        OR: [
                            { email: { contains: search, mode: 'insensitive' } },
                            { fullName: { contains: search, mode: 'insensitive' } },
                            { profile: { is: { fullName: { contains: search, mode: 'insensitive' } } } }
                        ]
                    },
                    ...searchTokens.map((token) => ({
                        OR: [
                            { email: { contains: token, mode: 'insensitive' } },
                            { fullName: { contains: token, mode: 'insensitive' } },
                            { profile: { is: { fullName: { contains: token, mode: 'insensitive' } } } }
                        ]
                    }))
                ]
            }
            : {}),
        ...(requestedStatus ? { isActive: requestedStatus === 'active' } : {}),
        ...(requestedMustChangePassword !== undefined ? { mustChangePassword: requestedMustChangePassword } : {}),
        ...roleWhere
    };
    const [total, users] = await prisma.$transaction([
        prisma.user.count({ where }),
        prisma.user.findMany({
            where,
            include: {
                userRoles: { include: { role: true } },
                profile: {
                    select: {
                        id: true,
                        fullName: true,
                        position: true,
                        department: true,
                        phone: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize
        })
    ]);
    res.json(paginated(users.map((user) => toUserResponse(user)), {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
    }));
}));
usersRouter.post('/', requireAuth, requireRoles('ADMIN'), requireCsrf, validate(createUserSchema), asyncHandler(async (req, res) => {
    const normalizedEmail = req.body.email.toLowerCase().trim();
    const normalizedFullName = req.body.fullName.trim();
    const normalizedPosition = normalizeOptional(req.body.position);
    const normalizedDepartment = normalizeOptional(req.body.department);
    const normalizedPhone = normalizeOptional(req.body.phone);
    const normalizedAvatarUrl = normalizeOptional(req.body.avatarUrl);
    const roleName = mapPublicRoleToInternal(req.body.role);
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
    if (existingUser) {
        throw badRequest('Email is already in use');
    }
    const roleRecord = await prisma.role.findUnique({ where: { name: roleName } });
    if (!roleRecord) {
        throw badRequest('Role is not configured');
    }
    const user = await prisma.user.create({
        data: {
            email: normalizedEmail,
            fullName: normalizedFullName,
            jobTitle: normalizedPosition,
            department: normalizedDepartment,
            phone: normalizedPhone,
            profilePhotoUrl: normalizedAvatarUrl,
            isActive: req.body.isActive ?? true,
            mustChangePassword: true,
            passwordHash: await argon2.hash(req.body.temporaryPassword),
            userRoles: {
                create: [{ roleId: roleRecord.id }]
            },
            profile: {
                create: {
                    fullName: normalizedFullName,
                    position: normalizedPosition,
                    department: normalizedDepartment,
                    phone: normalizedPhone,
                    avatarUrl: normalizedAvatarUrl
                }
            }
        },
        include: {
            userRoles: { include: { role: true } },
            profile: {
                select: {
                    id: true,
                    fullName: true,
                    position: true,
                    department: true,
                    phone: true,
                    avatarUrl: true
                }
            }
        }
    });
    await auditService.log({
        userId: req.user?.id,
        action: 'CREATE',
        entityType: 'USER',
        entityId: user.id
    });
    res.status(201).json(toUserResponse(user));
}));
usersRouter.patch('/:id', requireAuth, requireRoles('ADMIN'), requireCsrf, validate(updateUserSchema), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const roleName = req.body.role ? mapPublicRoleToInternal(req.body.role) : null;
    const normalizedEmail = typeof req.body.email === 'string' ? req.body.email.toLowerCase().trim() : undefined;
    const normalizedFullName = typeof req.body.fullName === 'string' ? req.body.fullName.trim() : undefined;
    const normalizedPosition = normalizeOptional(req.body.position);
    const normalizedDepartment = normalizeOptional(req.body.department);
    const normalizedPhone = normalizeOptional(req.body.phone);
    const normalizedAvatarUrl = normalizeOptional(req.body.avatarUrl);
    const profileMirrorValues = {
        fullName: normalizedFullName,
        position: normalizedPosition,
        department: normalizedDepartment,
        phone: normalizedPhone,
        avatarUrl: normalizedAvatarUrl
    };
    if (normalizedEmail) {
        const duplicate = await prisma.user.findFirst({
            where: { email: normalizedEmail, id: { not: id } },
            select: { id: true }
        });
        if (duplicate) {
            throw badRequest('Email is already in use');
        }
    }
    await prisma.$transaction(async (tx) => {
        const userExists = await tx.user.findUnique({ where: { id }, select: { id: true } });
        if (!userExists) {
            throw notFound('User not found');
        }
        await tx.user.update({
            where: { id },
            data: {
                email: normalizedEmail,
                isActive: req.body.isActive,
                ...toUserMirrorUpdateData(profileMirrorValues)
            }
        });
        const shouldUpdateProfile = hasProfileMirrorChanges(profileMirrorValues);
        if (shouldUpdateProfile) {
            const user = await tx.user.findUniqueOrThrow({
                where: { id },
                select: { id: true, fullName: true, jobTitle: true, department: true, phone: true, profilePhotoUrl: true }
            });
            await upsertProfileMirror(tx, id, profileMirrorValues, {
                fullName: user.fullName,
                position: user.jobTitle,
                department: user.department,
                phone: user.phone,
                avatarUrl: user.profilePhotoUrl
            });
        }
        if (roleName) {
            const roleRecord = await tx.role.findUnique({ where: { name: roleName }, select: { id: true } });
            if (!roleRecord) {
                throw badRequest('Role is not configured');
            }
            await tx.userRole.deleteMany({ where: { userId: id } });
            await tx.userRole.create({ data: { userId: id, roleId: roleRecord.id } });
        }
    });
    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            userRoles: { include: { role: true } },
            profile: {
                select: {
                    id: true,
                    fullName: true,
                    position: true,
                    department: true,
                    phone: true,
                    avatarUrl: true
                }
            }
        }
    });
    if (!user) {
        throw notFound('User not found');
    }
    await auditService.log({
        userId: req.user?.id,
        action: 'UPDATE',
        entityType: 'USER',
        entityId: id
    });
    res.json(toUserResponse(user));
}));
usersRouter.post('/:id/block', requireAuth, requireRoles('ADMIN'), requireCsrf, validate(userIdSchema), asyncHandler(async (req, res) => {
    const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { isActive: false },
        include: {
            userRoles: { include: { role: true } },
            profile: {
                select: {
                    id: true,
                    fullName: true,
                    position: true,
                    department: true,
                    phone: true,
                    avatarUrl: true
                }
            }
        }
    });
    await prisma.session.updateMany({
        where: {
            userId: req.params.id,
            revokedAt: null
        },
        data: { revokedAt: new Date() }
    });
    await auditService.log({
        userId: req.user?.id,
        action: 'BLOCK',
        entityType: 'USER',
        entityId: req.params.id
    });
    res.json(toUserResponse(user));
}));
usersRouter.post('/:id/unblock', requireAuth, requireRoles('ADMIN'), requireCsrf, validate(userIdSchema), asyncHandler(async (req, res) => {
    const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { isActive: true },
        include: {
            userRoles: { include: { role: true } },
            profile: {
                select: {
                    id: true,
                    fullName: true,
                    position: true,
                    department: true,
                    phone: true,
                    avatarUrl: true
                }
            }
        }
    });
    await auditService.log({
        userId: req.user?.id,
        action: 'UNBLOCK',
        entityType: 'USER',
        entityId: req.params.id
    });
    res.json(toUserResponse(user));
}));
usersRouter.post('/:id/reset-password', requireAuth, requireRoles('ADMIN'), requireCsrf, validate(resetPasswordSchema), asyncHandler(async (req, res) => {
    await prisma.user.update({
        where: { id: req.params.id },
        data: {
            passwordHash: await argon2.hash(req.body.temporaryPassword),
            mustChangePassword: true
        }
    });
    await prisma.session.updateMany({
        where: { userId: req.params.id, revokedAt: null },
        data: { revokedAt: new Date() }
    });
    await auditService.log({
        userId: req.user?.id,
        action: 'RESET_PASSWORD',
        entityType: 'USER',
        entityId: req.params.id
    });
    res.json({ success: true, mustChangePassword: true });
}));
usersRouter.delete('/:id', requireAuth, requireRoles('ADMIN'), requireCsrf, validate(userIdSchema), asyncHandler(async (req, res) => {
    if (req.user?.id === req.params.id) {
        throw badRequest('You cannot delete your own account');
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    await auditService.log({
        userId: req.user?.id,
        action: 'DELETE',
        entityType: 'USER',
        entityId: req.params.id
    });
    res.status(204).send();
}));
