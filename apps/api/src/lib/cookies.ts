import type { CookieOptions } from 'express';
import crypto from 'node:crypto';
import { env, isProduction } from '../config/env.js';

export const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: isProduction,
  path: '/'
};

export const refreshCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  maxAge: env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000
};

export const accessCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  maxAge: 15 * 60 * 1000
};

export const csrfCookieOptions: CookieOptions = {
  httpOnly: false,
  sameSite: 'lax',
  secure: isProduction,
  path: '/'
};

export const generateCsrfToken = (): string => crypto.randomBytes(32).toString('hex');
