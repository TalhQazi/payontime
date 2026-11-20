import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../types/index.js';
import { IdempotencyRecord } from '../models/index.js';
import { AppError } from './errorHandler.js';

export function idempotencyMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // Only apply to mutating methods (POST, PUT, PATCH, DELETE)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const idempotencyKey =
    (req.headers['idempotency-key'] as string) || req.body?.idempotencyKey;

  if (!idempotencyKey) {
    // If not supplied, proceed without idempotency caching unless endpoint explicitly demands it
    return next();
  }

  const organizationId = req.user?.organizationId;
  if (!organizationId) {
    return next();
  }

  const requestHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(req.body || {}))
    .digest('hex');

  const endpoint = `${req.method} ${req.baseUrl || ''}${req.path}`;

  IdempotencyRecord.findOne({ key: idempotencyKey, organizationId })
    .then((existingRecord) => {
      if (existingRecord) {
        if (existingRecord.status === 'COMPLETED') {
          res.setHeader('X-Idempotency-Status', 'REPLAYED');
          return res
            .status(existingRecord.responseStatusCode || 200)
            .json(existingRecord.responseBody);
        }

        if (existingRecord.status === 'PROCESSING') {
          return next(
            new AppError({
              statusCode: 409,
              code: 'IDEMPOTENCY_CONCURRENT_REQUEST',
              message:
                'An operation with this idempotency key is currently processing. Please do not retry immediately.',
            })
          );
        }
      }

      // Create new record with 48 hour TTL
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
      IdempotencyRecord.create({
        key: idempotencyKey,
        organizationId,
        endpoint,
        requestHash,
        status: 'PROCESSING',
        expiresAt,
      })
        .then(() => {
          // Intercept res.json to capture response
          const originalJson = res.json.bind(res);
          res.json = (body: any) => {
            const statusCode = res.statusCode;
            IdempotencyRecord.updateOne(
              { key: idempotencyKey, organizationId },
              {
                status: statusCode < 400 ? 'COMPLETED' : 'FAILED',
                responseStatusCode: statusCode,
                responseBody: body,
              }
            ).catch(() => {});
            return originalJson(body);
          };
          next();
        })
        .catch((err) => {
          if (err.code === 11000) {
            return next(
              new AppError({
                statusCode: 409,
                code: 'IDEMPOTENCY_CONCURRENT_REQUEST',
                message:
                  'A duplicate request with this idempotency key was detected.',
              })
            );
          }
          next(err);
        });
    })
    .catch(next);
}
