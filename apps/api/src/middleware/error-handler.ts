import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { Prisma } from '@prisma/client';
import { AppError, badRequest, conflict, notFound } from '../common/errors.js';
import { logger } from '../lib/logger.js';

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl
  });
};

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      details: err.details ?? null
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : err.message;
    res.status(400).json({
      error: message,
      details: null
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      const mapped = notFound('Resource not found');
      res.status(mapped.statusCode).json({ error: mapped.message, details: null });
      return;
    }

    if (err.code === 'P2002') {
      const targetMeta = (err.meta as Record<string, unknown> | undefined)?.target;
      const fields = Array.isArray(targetMeta) ? targetMeta.filter((entry): entry is string => typeof entry === 'string') : [];
      const field = fields.length > 0 ? fields.join(', ') : 'unique field';
      const mapped = conflict(`Duplicate value for ${field}`);
      res.status(mapped.statusCode).json({ error: mapped.message, details: null });
      return;
    }

    if (err.code === 'P2003') {
      const mapped = conflict('Operation violates related data constraints');
      res.status(mapped.statusCode).json({ error: mapped.message, details: null });
      return;
    }

    const mapped = badRequest('Invalid data for database operation');
    res.status(mapped.statusCode).json({ error: mapped.message, details: null });
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    const mapped = badRequest('Invalid query parameters');
    res.status(mapped.statusCode).json({ error: mapped.message, details: null });
    return;
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    res.status(503).json({
      error: 'Database is unavailable',
      details: null
    });
    return;
  }

  const syntaxError = err as (SyntaxError & { status?: number }) | null;
  if (syntaxError instanceof SyntaxError && syntaxError.status === 400) {
    const mapped = badRequest('Invalid JSON payload');
    res.status(mapped.statusCode).json({ error: mapped.message, details: null });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    error: 'Internal server error'
  });
};

