import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export const signAccessToken = (payload) => jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_TTL });
export const verifyAccessToken = (token) => jwt.verify(token, env.JWT_ACCESS_SECRET);
export const signRefreshToken = (payload) => jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: `${env.JWT_REFRESH_TTL_DAYS}d` });
export const verifyRefreshToken = (token) => jwt.verify(token, env.JWT_REFRESH_SECRET);
