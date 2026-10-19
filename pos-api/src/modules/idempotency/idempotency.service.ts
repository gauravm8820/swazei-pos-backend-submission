import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger } from '@nestjs/common';
import { IdempotencyKey } from './entities/idempotency-key.entity';

const TTL_HOURS = 24;

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(
    @InjectRepository(IdempotencyKey)
    private readonly repo: Repository<IdempotencyKey>,
  ) {}

  async findKey(storeId: string, key: string): Promise<IdempotencyKey | null> {
    return this.repo.findOne({ where: { storeId, key } });
  }

  async createKey(storeId: string, key: string, requestHash: string): Promise<IdempotencyKey> {
    const expiresAt = new Date(Date.now() + TTL_HOURS * 60 * 60 * 1000);
    const entity = this.repo.create({
      storeId,
      key,
      requestHash,
      isProcessing: true,
      expiresAt,
    });
    return this.repo.save(entity);
  }

  async completeKey(
    storeId: string,
    key: string,
    responseStatus: number,
    responseBody: any,
  ): Promise<void> {
    await this.repo.update(
      { storeId, key },
      { responseStatus, responseBody, isProcessing: false },
    );
  }

  async deleteKey(storeId: string, key: string): Promise<void> {
    await this.repo.delete({ storeId, key });
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredKeys(): Promise<void> {
    const result = await this.repo.delete({
      expiresAt: LessThan(new Date()),
    });
    this.logger.log(`Cleaned up ${result.affected} expired idempotency keys`);
  }
}
