import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { StoreInventory } from './entities/store-inventory.entity';

@Injectable()
export class InventoryRepository {
  constructor(
    @InjectRepository(StoreInventory)
    private readonly repo: Repository<StoreInventory>,
  ) {}

  async findAll(storeId: string): Promise<StoreInventory[]> {
    return this.repo.find({
      where: { storeId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(storeId: string, productId: string): Promise<StoreInventory | null> {
    return this.repo.findOne({ where: { storeId, productId } });
  }

  async findByProductIds(
    storeId: string,
    productIds: string[],
  ): Promise<StoreInventory[]> {
    if (!productIds.length) return [];
    return this.repo.find({ where: { storeId, productId: In(productIds) } });
  }

  async upsert(storeId: string, productId: string, quantity: number): Promise<StoreInventory> {
    const existing = await this.findOne(storeId, productId);
    if (existing) {
      existing.quantity = quantity;
      return this.repo.save(existing);
    }
    const inv = this.repo.create({ storeId, productId, quantity });
    return this.repo.save(inv);
  }

  // Used inside a transaction (EntityManager passed in)
  async lockAndFetchForUpdate(
    em: EntityManager,
    storeId: string,
    productIds: string[],
  ): Promise<StoreInventory[]> {
    return em
      .createQueryBuilder(StoreInventory, 'inv')
      .where('inv.storeId = :storeId', { storeId })
      .andWhere('inv.productId IN (:...productIds)', { productIds })
      .setLock('pessimistic_write')
      .orderBy('inv.productId', 'ASC') // deadlock prevention: consistent order
      .getMany();
  }

  async decrementBatch(
    em: EntityManager,
    decrements: { storeId: string; productId: string; qty: number }[],
  ): Promise<void> {
    for (const { storeId, productId, qty } of decrements) {
      await em
        .createQueryBuilder()
        .update(StoreInventory)
        .set({ quantity: () => `quantity - ${qty}` })
        .where('storeId = :storeId AND productId = :productId', { storeId, productId })
        .execute();
    }
  }

  async incrementBatch(
    em: EntityManager,
    increments: { storeId: string; productId: string; qty: number }[],
  ): Promise<void> {
    for (const { storeId, productId, qty } of increments) {
      await em
        .createQueryBuilder()
        .update(StoreInventory)
        .set({ quantity: () => `quantity + ${qty}` })
        .where('storeId = :storeId AND productId = :productId', { storeId, productId })
        .execute();
    }
  }
}
