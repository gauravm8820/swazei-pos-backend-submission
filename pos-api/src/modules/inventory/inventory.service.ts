import {
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InventoryRepository } from './inventory.repository';
import { JwtPayload } from '../../common/types/jwt-payload.type';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

const INV_TTL = 30_000; // 30 seconds

@Injectable()
export class InventoryService {
  constructor(
    private readonly inventoryRepo: InventoryRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private invKey(storeId: string, productId: string) {
    return `inventory:store:${storeId}:product:${productId}`;
  }

  async findAll(storeId: string) {
    return this.inventoryRepo.findAll(storeId);
  }

  async findOne(storeId: string, productId: string) {
    const cacheKey = this.invKey(storeId, productId);
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    const inv = await this.inventoryRepo.findOne(storeId, productId);
    if (!inv) throw new NotFoundException('Inventory record not found');

    await this.cacheManager.set(cacheKey, inv, INV_TTL);
    return inv;
  }

  async updateStock(storeId: string, productId: string, dto: UpdateInventoryDto) {
    const inv = await this.inventoryRepo.upsert(storeId, productId, dto.quantity);
    // Invalidate cache
    await this.cacheManager.del(this.invKey(storeId, productId));
    return inv;
  }
}
