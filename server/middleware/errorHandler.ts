import type { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  details?: unknown;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Server Error] [${statusCode}]:`, err);

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack, details: err.details }),
  });
}
