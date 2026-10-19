import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  ConflictException,
  UnprocessableEntityException,
  Inject,
  Logger,
} from '@nestjs/common';
import { Observable, from, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { createHash } from 'crypto';
import { IdempotencyService } from '../../modules/idempotency/idempotency.service';
import { JwtPayload } from '../types/jwt-payload.type';
import { Request, Response } from 'express';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(private readonly idempotencyService: IdempotencyService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const user: JwtPayload = (req as any).user;

    const idempotencyKey = req.headers['idempotency-key'] as string;

    if (!idempotencyKey) {
      throw new BadRequestException(
        'Missing required header: Idempotency-Key',
      );
    }

    const requestHash = this.computeHash(req);
    const storeId = req.params?.storeId || user?.storeId;

    if (!storeId) {
      throw new BadRequestException('Cannot determine store context');
    }

    return from(
      this.idempotencyService.findKey(storeId, idempotencyKey),
    ).pipe(
      switchMap((existing) => {
        if (existing) {
          // Key already exists
          if (existing.requestHash !== requestHash) {
            throw new UnprocessableEntityException(
              'Idempotency-Key reused with a different request payload',
            );
          }

          if (existing.isProcessing) {
            throw new ConflictException(
              'A request with this Idempotency-Key is already being processed',
            );
          }

          // Completed — replay stored response
          this.logger.log(`Replaying idempotency key: ${idempotencyKey}`);
          res.setHeader('X-Idempotency-Replayed', 'true');
          res.status(existing.responseStatus!);
          return of(existing.responseBody);
        }

        // New key — mark as processing
        return from(
          this.idempotencyService.createKey(storeId, idempotencyKey, requestHash),
        ).pipe(
          switchMap(() =>
            next.handle().pipe(
              switchMap(async (responseBody) => {
                const statusCode = res.statusCode || 201;
                await this.idempotencyService.completeKey(
                  storeId,
                  idempotencyKey,
                  statusCode,
                  responseBody,
                );
                return responseBody;
              }),
              catchError(async (err) => {
                try {
                  await this.idempotencyService.deleteKey(storeId, idempotencyKey);
                } catch (delErr) {
                  this.logger.error(`Error deleting key ${idempotencyKey}: ${delErr}`);
                }
                throw err;
              }),
            ),
          ),
        );
      }),
    );
  }

  private computeHash(req: Request): string {
    const body = JSON.stringify(
      Object.keys(req.body || {})
        .sort()
        .reduce(
          (acc, key) => {
            acc[key] = (req.body as Record<string, unknown>)[key];
            return acc;
          },
          {} as Record<string, unknown>,
        ),
    );
    return createHash('sha256')
      .update(`${req.method}:${req.path}:${body}`)
      .digest('hex');
  }
}
