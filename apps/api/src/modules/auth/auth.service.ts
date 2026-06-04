import argon2 from 'argon2';
import crypto from 'node:crypto';
import { RoleName, type PrismaClient, type User } from '@prisma/client';
import { unauthorized } from '../../common/errors.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt.js';

interface AuthenticatedUser {
  user: User;
  roles: RoleName[];
  mustChangePassword: boolean;
}

export class AuthService {
  constructor(private readonly prisma: PrismaClient) {}

  async authenticate(email: string, password: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { userRoles: { include: { role: true } } }
    });

    if (!user || !user.isActive) {
      throw unauthorized('Invalid credentials');
    }

    const passwordMatches = await argon2.verify(user.passwordHash, password);
    if (!passwordMatches) {
      throw unauthorized('Invalid credentials');
    }

    return {
      user,
      roles: user.userRoles.map((entry) => entry.role.name),
      mustChangePassword: user.mustChangePassword
    };
  }

  async createSession(params: {
    userId: string;
    email: string;
    roles: RoleName[];
    userAgent?: string;
    ipAddress?: string;
  }): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> {
    const sessionId = crypto.randomUUID();
    const refreshToken = signRefreshToken({ sub: params.userId, sessionId });
    const accessToken = signAccessToken({ sub: params.userId, email: params.email, roles: params.roles });

    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId: params.userId,
        refreshTokenHash: await argon2.hash(refreshToken),
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        userAgent: params.userAgent,
        ipAddress: params.ipAddress
      }
    });

    await this.prisma.user.update({ where: { id: params.userId }, data: { lastLoginAt: new Date() } });

    return { accessToken, refreshToken, sessionId };
  }

  async rotateRefreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    userId: string;
    roles: RoleName[];
    email: string;
    mustChangePassword: boolean;
  }> {
    const payload = verifyRefreshToken(refreshToken);

    const session = await this.prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: { user: { include: { userRoles: { include: { role: true } } } } }
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw unauthorized('Session is invalid');
    }

    const validRefresh = await argon2.verify(session.refreshTokenHash, refreshToken);
    if (!validRefresh) {
      throw unauthorized('Session is invalid');
    }

    const roles = session.user.userRoles.map((entry) => entry.role.name);
    const nextRefreshToken = signRefreshToken({ sub: session.userId, sessionId: session.id });
    const nextAccessToken = signAccessToken({ sub: session.user.id, email: session.user.email, roles });

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: await argon2.hash(nextRefreshToken),
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      }
    });

    return {
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
      userId: session.user.id,
      roles,
      email: session.user.email,
      mustChangePassword: session.user.mustChangePassword
    };
  }

  async revokeSession(refreshToken: string): Promise<void> {
    const payload = verifyRefreshToken(refreshToken);
    await this.prisma.session.updateMany({
      where: { id: payload.sessionId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }
}
