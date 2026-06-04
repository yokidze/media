export class AppError extends Error {
    statusCode;
    details;
    constructor(message, statusCode = 500, details) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.details = details;
    }
}
export const notFound = (message = 'Resource not found') => new AppError(message, 404);
export const forbidden = (message = 'Forbidden') => new AppError(message, 403);
export const unauthorized = (message = 'Unauthorized') => new AppError(message, 401);
export const badRequest = (message = 'Bad request', details) => new AppError(message, 400, details);
export const conflict = (message = 'Conflict', details) => new AppError(message, 409, details);
