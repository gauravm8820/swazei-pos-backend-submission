import { Injectable, NotFoundException } from '@nestjs/common';
import { StoresRepository } from './stores.repository';
import { JwtPayload } from '../../common/types/jwt-payload.type';
import { CreateStoreDto } from './dto/create-store.dto';

@Injectable()
export class StoresService {
  constructor(private readonly storesRepo: StoresRepository) {}

  async create(user: JwtPayload, dto: CreateStoreDto) {
    return this.storesRepo.create({ ...dto, merchantId: user.merchantId });
  }

  async findAll(user: JwtPayload) {
    return this.storesRepo.findAll(user.merchantId);
  }

  async findOne(user: JwtPayload, storeId: string) {
    const store = await this.storesRepo.findOne(storeId, user.merchantId);
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async update(user: JwtPayload, storeId: string, dto: Partial<CreateStoreDto>) {
    const store = await this.storesRepo.update(storeId, user.merchantId, dto);
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async deactivate(user: JwtPayload, storeId: string) {
    const store = await this.storesRepo.update(storeId, user.merchantId, { isActive: false });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }
}
