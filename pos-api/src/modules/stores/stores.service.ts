import { Injectable, NotFoundException } from '@nestjs/common';
import { StoresRepository } from './stores.repository';
import { JwtPayload, UserRole } from '../../common/types/jwt-payload.type';
import { CreateStoreDto } from './dto/create-store.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class StoresService {
  constructor(
    private readonly storesRepo: StoresRepository,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async create(user: JwtPayload, dto: CreateStoreDto) {
    if (user.role !== UserRole.SUPER_ADMIN && user.merchantId) {
      const existingStores = await this.storesRepo.findAll(user.merchantId);
      await this.subscriptionsService.checkCanAddStore(user.merchantId, existingStores.length);
    }

    return this.storesRepo.create({ ...dto, merchantId: user.merchantId! });
  }

  async findAll(user: JwtPayload) {
    if (user.role === UserRole.SUPER_ADMIN && !user.merchantId) {
      // Super admin can see all stores across merchants
      return this.storesRepo.findAll('');
    }
    return this.storesRepo.findAll(user.merchantId!);
  }

  async findOne(user: JwtPayload, storeId: string) {
    const store = user.role === UserRole.SUPER_ADMIN
      ? await this.storesRepo.findById(storeId)
      : await this.storesRepo.findOne(storeId, user.merchantId!);
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async update(user: JwtPayload, storeId: string, dto: Partial<CreateStoreDto>) {
    const store = await this.storesRepo.update(storeId, user.merchantId!, dto);
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async deactivate(user: JwtPayload, storeId: string) {
    const store = await this.storesRepo.update(storeId, user.merchantId!, { isActive: false });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }
}
