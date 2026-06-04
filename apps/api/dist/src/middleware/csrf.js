import { env } from '../config/env.js';
import { forbidden } from '../common/errors.js';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
export const requireCsrf = (req, _res, next) => {
    if (SAFE_METHODS.has(req.method)) {
        next();
        return;
    }
    const csrfCookie = req.cookies?.[env.CSRF_COOKIE_NAME];
    const csrfHeader = req.headers['x-csrf-token'];
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        next(forbidden('CSRF validation failed'));
        return;
    }
    next();
};
