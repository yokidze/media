export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const notFound = (message = 'Resource not found'): AppError => new AppError(message, 404);
export const forbidden = (message = 'Forbidden'): AppError => new AppError(message, 403);
export const unauthorized = (message = 'Unauthorized'): AppError => new AppError(message, 401);
export const badRequest = (message = 'Bad request', details?: unknown): AppError => new AppError(message, 400, details);
export const conflict = (message = 'Conflict', details?: unknown): AppError => new AppError(message, 409, details);
