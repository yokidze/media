import type { NextFunction, Request, Response } from 'express';
import type { RoleName } from '@prisma/client';
import { forbidden, unauthorized } from '../common/errors.js';

export const requireRoles = (...allowedRoles: RoleName[]) => (req: Request, _res: Response, next: NextFunction): void => {
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
