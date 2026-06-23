import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import argon2 from 'argon2';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../common/async-handler.js';
import { validate } from '../../middleware/validate.js';
import { changePasswordSchema, loginSchema, refreshSchema, updateMeSchema } from './auth.schemas.js';
import { AuthService } from './auth.service.js';
import { accessCookieOptions, csrfCookieOptions, generateCsrfToken, refreshCookieOptions } from '../../lib/cookies.js';
import { env } from '../../config/env.js';
import { requireAuth } from '../../middleware/auth.js';
import { AuditService } from '../../services/audit.service.js';
import { authRateLimiter } from '../../middleware/rate-limit.js';
import { requireCsrf } from '../../middleware/csrf.js';
import { badRequest } from '../../common/errors.js';
import { getStorageService } from '../../services/storage/index.js';
import { normalizeStorageRelativePath } from '../../services/storage/path-safety.js';
import { toUserMirrorUpdateData, upsertProfileMirror } from '../../services/user-profile-sync.service.js';
import { filterValidMaterials } from '../../services/material-integrity.service.js';

const authService = new AuthService(prisma);
const auditService = new AuditService(prisma);
const storage = getStorageService();

export const authRouter = Router();
const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const AVATAR_ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 1, fileSize: AVATAR_MAX_SIZE_BYTES }
});

const meSelect = {
  id: true,
  email: true,
  fullName: true,
  jobTitle: true,
  department: true,
  phone: true,
  profilePhotoUrl: true,
  mustChangePassword: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  profile: {
    select: {
      id: true,
      fullName: true,
      position: true,
      department: true,
      phone: true,
      avatarUrl: true,
      updatedAt: true
    }
  },
  userRoles: { include: { role: true } }
};

const MANAGED_STORAGE_PREFIX = 'storage:';

const normalizeOptional = (value: unknown): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toMeResponse = (user: {
  id: string;
  email: string;
  fullName: string;
  jobTitle: string | null;
  department: string | null;
  phone: string | null;
  profilePhotoUrl: string | null;
  mustChangePassword: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  profile: {
    id: string;
    fullName: string;
    position: string | null;
    department: string | null;
    phone: string | null;
    avatarUrl: string | null;
    updatedAt: Date;
  } | null;
  userRoles: Array<{ role: { name: string } }>;
}) => {
  const managedAvatarPath = extractManagedStoragePath(user.profile?.avatarUrl ?? user.profilePhotoUrl);
  const avatarVersion = user.profile?.updatedAt ?? user.updatedAt;
  const avatarUrl = managedAvatarPath ? `${env.API_BASE_PATH}/auth/me/avatar?v=${avatarVersion.getTime()}` : user.profile?.avatarUrl ?? user.profilePhotoUrl;

  return {
    id: user.id,
    email: user.email,
    fullName: user.profile?.fullName ?? user.fullName,
    jobTitle: user.profile?.position ?? user.jobTitle,
    department: user.profile?.department ?? user.department,
    phone: user.profile?.phone ?? user.phone,
    profilePhotoUrl: avatarUrl,
    mustChangePassword: user.mustChangePassword,
    isActive: user.isActive,
    roles: user.userRoles.map((entry) => entry.role.name),
    role: user.userRoles.some((entry) => entry.role.name === 'ADMIN') ? 'admin' : 'teacher',
    profile: user.profile
      ? {
          id: user.profile.id,
          fullName: user.profile.fullName,
          position: user.profile.position,
          department: user.profile.department,
          phone: user.profile.phone,
          avatarUrl
        }
      : null,
    createdAt: user.createdAt
  };
};

const extractManagedStoragePath = (url: string | null | undefined): string | null => {
  if (!url) return null;

  const normalizeManagedPath = (candidate: string): string | null => {
    try {
      return normalizeStorageRelativePath(candidate);
    } catch {
      return null;
    }
  };

  if (url.startsWith(MANAGED_STORAGE_PREFIX)) {
    return normalizeManagedPath(url.slice(MANAGED_STORAGE_PREFIX.length));
  }

  if (url.startsWith('/api/storage/')) {
    return normalizeManagedPath(url.slice('/api/storage/'.length));
  }

  if (url.startsWith('/storage/')) {
    return normalizeManagedPath(url.slice('/storage/'.length));
  }

  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith('/api/storage/')) {
      return normalizeManagedPath(parsed.pathname.slice('/api/storage/'.length));
    }
    if (parsed.pathname.startsWith('/storage/')) {
      return normalizeManagedPath(parsed.pathname.slice('/storage/'.length));
    }
  } catch {
    return null;
  }

  return null;
};

const toManagedStoragePointer = (relativePath: string): string => `${MANAGED_STORAGE_PREFIX}${relativePath}`;

authRouter.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { user, roles, mustChangePassword } = await authService.authenticate(email, password);
    const session = await authService.createSession({
      userId: user.id,
      email: user.email,
      roles,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });

    const csrfToken = generateCsrfToken();

    res.cookie(env.ACCESS_TOKEN_COOKIE_NAME, session.accessToken, accessCookieOptions);
    res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, session.refreshToken, refreshCookieOptions);
    res.cookie(env.CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions);

    await auditService.log({
      userId: user.id,
      action: 'LOGIN',
      entityType: 'AUTH',
      entityId: session.sessionId,
      metadata: { email: user.email }
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles,
        role: roles.includes('ADMIN') ? 'admin' : 'teacher',
        mustChangePassword
      },
      csrfToken
    });
  })
);

authRouter.post(
  '/refresh',
  authRateLimiter,
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    const tokenFromCookie = req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME] as string | undefined;
    const refreshToken = req.body.refreshToken ?? tokenFromCookie;
    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh token is required' });
      return;
    }

    const session = await authService.rotateRefreshToken(refreshToken);
    const csrfToken = generateCsrfToken();

    res.cookie(env.ACCESS_TOKEN_COOKIE_NAME, session.accessToken, accessCookieOptions);
    res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, session.refreshToken, refreshCookieOptions);
    res.cookie(env.CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions);

    res.json({
      user: {
        id: session.userId,
        email: session.email,
        roles: session.roles,
        role: session.roles.includes('ADMIN') ? 'admin' : 'teacher',
        mustChangePassword: session.mustChangePassword
      },
      csrfToken
    });
  })
);

authRouter.post(
  '/logout',
  requireAuth,
  requireCsrf,
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME] as string | undefined;
    if (refreshToken) {
      await authService.revokeSession(refreshToken);
    }

    res.clearCookie(env.ACCESS_TOKEN_COOKIE_NAME);
    res.clearCookie(env.REFRESH_TOKEN_COOKIE_NAME);
    res.clearCookie(env.CSRF_COOKIE_NAME);

    await auditService.log({
      userId: req.user?.id,
      action: 'LOGOUT',
      entityType: 'AUTH'
    });

    res.status(204).send();
  })
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: meSelect
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(toMeResponse(user));
  })
);

authRouter.get(
  '/me/avatar',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        profilePhotoUrl: true,
        profile: { select: { avatarUrl: true } }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const managedPath = extractManagedStoragePath(user.profile?.avatarUrl ?? user.profilePhotoUrl);
    if (!managedPath) {
      res.status(404).json({ error: 'Avatar not found' });
      return;
    }

    const target = await storage.getDownloadTarget(managedPath);
    if (target.type === 'remote') {
      res.redirect(target.url);
      return;
    }

    res.type('image/webp');
    res.sendFile(target.path);
  })
);

authRouter.patch(
  '/me',
  requireAuth,
  requireCsrf,
  validate(updateMeSchema),
  asyncHandler(async (req, res) => {
    const incomingEmail = typeof req.body.email === 'string' ? req.body.email.toLowerCase() : undefined;
    if (incomingEmail) {
      const userWithSameEmail = await prisma.user.findFirst({
        where: {
          email: incomingEmail,
          id: { not: req.user!.id }
        },
        select: { id: true }
      });

      if (userWithSameEmail) {
        throw badRequest('Email is already in use');
      }
    }

    const normalizedFullName = typeof req.body.fullName === 'string' ? req.body.fullName.trim() : undefined;
    const normalizedPosition = normalizeOptional(req.body.position ?? req.body.jobTitle);
    const normalizedDepartment = normalizeOptional(req.body.department);
    const normalizedPhone = normalizeOptional(req.body.phone);
    const normalizedAvatar = normalizeOptional(req.body.avatarUrl ?? req.body.profilePhotoUrl);
    const profileMirrorValues = {
      fullName: normalizedFullName,
      position: normalizedPosition,
      department: normalizedDepartment,
      phone: normalizedPhone,
      avatarUrl: normalizedAvatar
    };
    if (normalizedAvatar && extractManagedStoragePath(normalizedAvatar)) {
      throw badRequest('Managed avatar paths can only be changed via /auth/me/avatar');
    }

    const user = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: req.user!.id },
        data: {
          email: incomingEmail,
          ...toUserMirrorUpdateData(profileMirrorValues)
        },
        select: {
          id: true,
          fullName: true,
          jobTitle: true,
          department: true,
          phone: true,
          profilePhotoUrl: true
        }
      });

      await upsertProfileMirror(tx, req.user!.id, profileMirrorValues, {
        fullName: updatedUser.fullName,
        position: updatedUser.jobTitle,
        department: updatedUser.department,
        phone: updatedUser.phone,
        avatarUrl: updatedUser.profilePhotoUrl
      });

      return tx.user.findUniqueOrThrow({
        where: { id: req.user!.id },
        select: meSelect
      });
    });

    await auditService.log({
      userId: req.user?.id,
      action: 'UPDATE',
      entityType: 'PROFILE',
      entityId: user.id
    });

    res.json(toMeResponse(user));
  })
);

authRouter.post(
  '/change-password',
  requireAuth,
  requireCsrf,
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, passwordHash: true }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isCurrentPasswordValid = await argon2.verify(user.passwordHash, req.body.currentPassword);
    if (!isCurrentPasswordValid) {
      throw badRequest('Current password is incorrect');
    }

    if (req.body.currentPassword === req.body.newPassword) {
      throw badRequest('New password must be different from current password');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await argon2.hash(req.body.newPassword),
        mustChangePassword: false
      }
    });

    await auditService.log({
      userId: req.user?.id,
      action: 'CHANGE_PASSWORD',
      entityType: 'AUTH',
      entityId: user.id
    });

    res.json({ success: true });
  })
);

authRouter.post(
  '/me/avatar',
  requireAuth,
  requireCsrf,
  avatarUpload.single('avatar'),
  asyncHandler(async (req, res) => {
    const file = req.file;

    if (!file) {
      throw badRequest('Image file is required');
    }

    if (file.size > AVATAR_MAX_SIZE_BYTES) {
      throw badRequest('Avatar file is too large (max 5MB)');
    }

    if (!AVATAR_ALLOWED_MIME.has(file.mimetype)) {
      throw badRequest('Unsupported avatar format. Allowed: JPG, JPEG, PNG, WEBP');
    }

    let normalizedBuffer: Buffer;
    try {
      normalizedBuffer = await sharp(file.buffer)
        .rotate()
        .resize(512, 512, { fit: 'cover' })
        .webp({ quality: 86 })
        .toBuffer();
    } catch {
      throw badRequest('Invalid image file');
    }

    const currentUser = await prisma.user.findUnique({ where: { id: req.user!.id }, select: meSelect });
    if (!currentUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const oldManagedPath = extractManagedStoragePath(currentUser.profile?.avatarUrl ?? currentUser.profilePhotoUrl);
    const saved = await storage.save({
      buffer: normalizedBuffer,
      folder: `avatars/${currentUser.id}`,
      extension: 'webp',
      mimeType: 'image/webp',
      originalName: file.originalname
    });

    const avatarUrl = toManagedStoragePointer(saved.relativePath);
    const user = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: currentUser.id },
        data: toUserMirrorUpdateData({ avatarUrl })
      });

      await upsertProfileMirror(tx, currentUser.id, { avatarUrl }, {
        fullName: currentUser.fullName,
        position: currentUser.jobTitle,
        department: currentUser.department,
        phone: currentUser.phone,
        avatarUrl: currentUser.profilePhotoUrl
      });

      return tx.user.findUniqueOrThrow({
        where: { id: currentUser.id },
        select: meSelect
      });
    });

    if (oldManagedPath && oldManagedPath !== saved.relativePath) {
      await storage.remove(oldManagedPath).catch(() => undefined);
    }

    await auditService.log({
      userId: req.user?.id,
      action: 'UPLOAD_AVATAR',
      entityType: 'PROFILE',
      entityId: currentUser.id,
      metadata: { mimeType: file.mimetype, sizeBytes: file.size }
    });

    res.json(toMeResponse(user));
  })
);

authRouter.delete(
  '/me/avatar',
  requireAuth,
  requireCsrf,
  asyncHandler(async (req, res) => {
    const currentUser = await prisma.user.findUnique({ where: { id: req.user!.id }, select: meSelect });
    if (!currentUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const oldManagedPath = extractManagedStoragePath(currentUser.profile?.avatarUrl ?? currentUser.profilePhotoUrl);
    if (oldManagedPath) {
      await storage.remove(oldManagedPath).catch(() => undefined);
    }

    const user = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: currentUser.id },
        data: toUserMirrorUpdateData({ avatarUrl: null })
      });

      await upsertProfileMirror(tx, currentUser.id, { avatarUrl: null }, {
        fullName: currentUser.fullName,
        position: currentUser.jobTitle,
        department: currentUser.department,
        phone: currentUser.phone,
        avatarUrl: currentUser.profilePhotoUrl
      });

      return tx.user.findUniqueOrThrow({
        where: { id: currentUser.id },
        select: meSelect
      });
    });

    await auditService.log({
      userId: req.user?.id,
      action: 'DELETE_AVATAR',
      entityType: 'PROFILE',
      entityId: currentUser.id
    });

    res.json(toMeResponse(user));
  })
);

authRouter.get(
  '/me/materials',
  requireAuth,
  asyncHandler(async (req, res) => {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, fullName: true }
    });

    if (!currentUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const items = await prisma.archiveItem.findMany({
      where: {
        deletedAt: null,
        OR: [{ createdById: currentUser.id }, { author: { is: { fullName: currentUser.fullName } } }]
      },
      orderBy: [{ updatedAt: 'desc' }],
      include: {
        category: true,
        files: { where: { isPrimary: true }, take: 1 }
      },
      take: 50
    });

    const validItems = await filterValidMaterials(
      items.map((item) => ({
        ...item,
        files: item.files.map((file) => ({ ...file, relativePath: file.relativePath }))
      }))
    );

    res.json(
      validItems.map((item) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        contentSection: item.contentSection,
        materialType: item.materialType,
        publicationDate: item.publicationDate,
        archiveYear: item.archiveYear,
        status: item.status,
        category: item.category ? { id: item.category.id, name: item.category.name } : null,
        previewFile: item.files[0] ? { id: item.files[0].id, mimeType: item.files[0].mimeType } : null
      }))
    );
  })
);

