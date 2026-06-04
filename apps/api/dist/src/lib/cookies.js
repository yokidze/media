import crypto from 'node:crypto';
import { env, isProduction } from '../config/env.js';
export const baseCookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/'
};
export const refreshCookieOptions = {
    ...baseCookieOptions,
    maxAge: env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000
};
export const accessCookieOptions = {
    ...baseCookieOptions,
    maxAge: 15 * 60 * 1000
};
export const csrfCookieOptions = {
    httpOnly: false,
    sameSite: 'lax',
    secure: isProduction,
    path: '/'
};
export const generateCsrfToken = () => crypto.randomBytes(32).toString('hex');
