import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Public } from '../../common/decorators/public.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Service health check' })
  async check() {
    let dbStatus = 'ok';
    let redisStatus = 'ok';

    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      dbStatus = 'error';
    }

    try {
      await this.cacheManager.set('__health__', '1', 5000);
      await this.cacheManager.del('__health__');
    } catch {
      redisStatus = 'error';
    }

    const overall = dbStatus === 'ok' && redisStatus === 'ok' ? 'ok' : 'degraded';
    return { status: overall, db: dbStatus, redis: redisStatus };
  }
}
