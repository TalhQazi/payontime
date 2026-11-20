import { Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AuthenticatedRequest } from '../types/index.js';
import { logger } from '../utils/logger.js';

export interface AppErrorOptions {
  statusCode: number;
  code: string;
  message: string;
  details?: any;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.details = options.details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function errorHandler(
  err: any,
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): void {
  const correlationId = req.correlationId;

  if (err instanceof AppError) {
    logger.warn(
      {
        correlationId,
        code: err.code,
        statusCode: err.statusCode,
        message: err.message,
      },
      'Application Error'
    );
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        correlationId,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    logger.warn({ correlationId, issues: err.issues }, 'Validation Error');
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The submitted request payload failed schema validation.',
        details: err.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
        correlationId,
      },
    });
    return;
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    logger.warn({ correlationId, keyPattern: err.keyPattern }, 'Duplicate Key Error');
    res.status(409).json({
      error: {
        code: 'CONFLICT_DUPLICATE_RESOURCE',
        message: 'A resource with this identifier or unique attribute already exists.',
        correlationId,
      },
    });
    return;
  }

  logger.error({ correlationId, err }, 'Unhandled Server Error');
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred.',
      correlationId,
    },
  });
}
