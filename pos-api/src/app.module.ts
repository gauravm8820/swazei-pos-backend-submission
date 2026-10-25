import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { redisStore } from 'cache-manager-ioredis-yet';

import configuration, { validationSchema } from './config/configuration';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

import { AuthModule } from './modules/auth/auth.module';
import { MerchantsModule } from './modules/merchants/merchants.module';
import { StoresModule } from './modules/stores/stores.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SalesModule } from './modules/sales/sales.module';
import { IdempotencyModule } from './modules/idempotency/idempotency.module';
import { HealthModule } from './modules/health/health.module';

import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';

// All entities
import { Merchant } from './modules/merchants/entities/merchant.entity';
import { Store } from './modules/stores/entities/store.entity';
import { User } from './modules/users/entities/user.entity';
import { Product } from './modules/products/entities/product.entity';
import { StoreInventory } from './modules/inventory/entities/store-inventory.entity';
import { Sale } from './modules/sales/entities/sale.entity';
import { SaleItem } from './modules/sales/entities/sale-item.entity';
import { Payment } from './modules/sales/entities/payment.entity';
import { IdempotencyKey } from './modules/idempotency/entities/idempotency-key.entity';
import { SubscriptionPlan } from './modules/subscriptions/entities/subscription-plan.entity';
import { MerchantSubscription } from './modules/subscriptions/entities/merchant-subscription.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isTest = config.get('NODE_ENV') === 'test';
        return {
          type: 'postgres',
          host: config.get('DATABASE_HOST'),
          port: config.get<number>('DATABASE_PORT'),
          username: config.get('DATABASE_USER'),
          password: config.get('DATABASE_PASSWORD'),
          database: isTest
            ? config.get('DATABASE_TEST_NAME')
            : config.get('DATABASE_NAME'),
          entities: [
            Merchant, Store, User, Product, StoreInventory,
            Sale, SaleItem, Payment, IdempotencyKey,
            SubscriptionPlan, MerchantSubscription,
          ],
          migrations: [__dirname + '/database/migrations/*.{ts,js}'],
          synchronize: false,
          logging: config.get('NODE_ENV') === 'development',
          extra: { max: 20, min: 2 }, // connection pool
        };
      },
    }),

    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const password = config.get<string>('REDIS_PASSWORD');
        return {
          store: await redisStore({
            host: config.get('REDIS_HOST'),
            port: config.get<number>('REDIS_PORT'),
            password: password || undefined,
            ttl: 300_000, // 5 min default in ms
          }),
        };
      },
    }),

    ScheduleModule.forRoot(),

    AuthModule,
    SubscriptionsModule,
    MerchantsModule,
    StoresModule,
    UsersModule,
    ProductsModule,
    InventoryModule,
    SalesModule,
    IdempotencyModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
