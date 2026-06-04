import argon2 from 'argon2';
import crypto from 'node:crypto';
import { unauthorized } from '../../common/errors.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt.js';
export class AuthService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async authenticate(email, password) {
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
    async createSession(params) {
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
    async rotateRefreshToken(refreshToken) {
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
    async revokeSession(refreshToken) {
        const payload = verifyRefreshToken(refreshToken);
        await this.prisma.session.updateMany({
            where: { id: payload.sessionId, revokedAt: null },
            data: { revokedAt: new Date() }
        });
    }
}
