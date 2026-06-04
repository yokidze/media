import { forbidden, unauthorized } from '../common/errors.js';
export const requireRoles = (...allowedRoles) => (req, _res, next) => {
    if (!req.user) {
        next(unauthorized());
        return;
    }
    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
        next(forbidden());
        return;
    }
    next();
};
