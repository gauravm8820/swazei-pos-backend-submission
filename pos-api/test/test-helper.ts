import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { runSeed } from '../src/database/seeds/seed';
import { SEED_CONSTANTS } from '../src/database/seeds/seed-constants';

export class TestHelper {
  public app: INestApplication;
  public dataSource: DataSource;

  async init(): Promise<void> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    this.app.setGlobalPrefix('api/v1');
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await this.app.init();
    this.dataSource = this.app.get(DataSource);
  }

  async resetDatabase(): Promise<void> {
    // Truncate all tables in proper order
    await this.dataSource.query(`
      TRUNCATE TABLE "idempotency_keys", "payments", "sale_items", "sales",
                     "store_inventory", "products", "users", "stores", "merchants"
      CASCADE;
    `);
    // Re-seed with deterministic fixtures
    await runSeed(this.dataSource);
  }

  async getAuthToken(email: string, password = SEED_CONSTANTS.DEFAULT_PASSWORD): Promise<string> {
    const res = await request(this.app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password });

    if (res.status !== 200 && res.status !== 201) {
      throw new Error(`Failed to login with ${email}: ${JSON.stringify(res.body)}`);
    }

    return res.body.data.accessToken;
  }

  async close(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
  }
}
