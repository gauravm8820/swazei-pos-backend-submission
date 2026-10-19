import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '../../modules/stores/entities/store.entity';
import { JwtPayload, UserRole } from '../types/jwt-payload.type';
import { Reflector } from '@nestjs/core';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class StoreAccessGuard implements CanActivate {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    // OWNER and ADMIN can access any store within their merchant
    // MANAGER and CASHIER can only access their own store
    const storeId = request.params?.storeId;
    if (!storeId) return true; // route doesn't have :storeId param

    // Check cache first
    const cacheKey = `store_access:${user.merchantId}:${storeId}`;
    const cached = await this.cacheManager.get<{ exists: boolean }>(cacheKey);

    let storeExists: boolean;
    let storeMerchantId: string | undefined;

    if (cached !== null && cached !== undefined) {
      storeExists = cached.exists;
      storeMerchantId = cached.exists ? user.merchantId : undefined;
    } else {
      const store = await this.storeRepo.findOne({
        where: { id: storeId },
        select: ['id', 'merchantId'],
      });

      storeExists = !!store;
      storeMerchantId = store?.merchantId;

      await this.cacheManager.set(
        cacheKey,
        { exists: storeExists, merchantId: storeMerchantId },
        60000, // 60 seconds TTL
      );
    }

    if (!storeExists) {
      throw new NotFoundException(`Store not found`);
    }

    // Check store belongs to this user's merchant
    if (storeMerchantId !== user.merchantId) {
      throw new ForbiddenException(`Access denied to this store`);
    }

    // For MANAGER and CASHIER, further restrict to their own store
    if (
      user.role === UserRole.MANAGER ||
      user.role === UserRole.CASHIER
    ) {
      if (user.storeId !== storeId) {
        throw new ForbiddenException(`Access denied to this store`);
      }
    }

    return true;
  }
}
