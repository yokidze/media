import jwt from 'jsonwebtoken';
import type { RoleName } from '@prisma/client';
import { env } from '../config/env.js';

interface AccessPayload {
  sub: string;
  email: string;
  roles: RoleName[];
}

interface RefreshPayload {
  sub: string;
  sessionId: string;
}

export const signAccessToken = (payload: AccessPayload): string =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions['expiresIn'] });

export const verifyAccessToken = (token: string): AccessPayload =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;

export const signRefreshToken = (payload: RefreshPayload): string =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: `${env.JWT_REFRESH_TTL_DAYS}d` as jwt.SignOptions['expiresIn'] });

export const verifyRefreshToken = (token: string): RefreshPayload =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload;
