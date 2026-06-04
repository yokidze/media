import { env } from '../config/env.js';
import { unauthorized } from '../common/errors.js';
import { verifyAccessToken } from '../lib/jwt.js';
const readToken = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }
    if (req.cookies?.[env.ACCESS_TOKEN_COOKIE_NAME]) {
        return req.cookies[env.ACCESS_TOKEN_COOKIE_NAME];
    }
    return null;
};
export const optionalAuth = (req, _res, next) => {
    const token = readToken(req);
    if (!token) {
        next();
        return;
    }
    try {
        const payload = verifyAccessToken(token);
        req.user = {
            id: payload.sub,
            email: payload.email,
            roles: payload.roles
        };
    }
    catch {
        req.user = undefined;
    }
    next();
};
export const requireAuth = (req, _res, next) => {
    const token = readToken(req);
    if (!token) {
        next(unauthorized());
        return;
    }
    try {
        const payload = verifyAccessToken(token);
        req.user = {
            id: payload.sub,
            email: payload.email,
            roles: payload.roles
        };
        next();
    }
    catch {
        next(unauthorized('Invalid or expired token'));
    }
};
