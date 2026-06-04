import multer from 'multer';
import { Prisma } from '@prisma/client';
import { AppError, badRequest, conflict, notFound } from '../common/errors.js';
import { logger } from '../lib/logger.js';
export const notFoundHandler = (req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.originalUrl
    });
};
export const errorHandler = (err, _req, res, _next) => {
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
            const targetMeta = err.meta?.target;
            const fields = Array.isArray(targetMeta) ? targetMeta.filter((entry) => typeof entry === 'string') : [];
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
    logger.error({ err }, 'Unhandled error');
    res.status(500).json({
        error: 'Internal server error'
    });
};
