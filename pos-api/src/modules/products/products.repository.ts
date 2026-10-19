import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsRepository {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

  async create(data: Partial<Product>): Promise<Product> {
    const product = this.repo.create(data);
    return this.repo.save(product);
  }

  async findAll(merchantId: string): Promise<Product[]> {
    return this.repo.find({
      where: { merchantId, isActive: true, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, merchantId: string): Promise<Product | null> {
    return this.repo.findOne({
      where: { id, merchantId, deletedAt: IsNull() },
    });
  }

  async findByIds(ids: string[], merchantId: string): Promise<Product[]> {
    if (!ids.length) return [];
    return this.repo
      .createQueryBuilder('p')
      .where('p.id IN (:...ids)', { ids })
      .andWhere('p.merchantId = :merchantId', { merchantId })
      .andWhere('p.isActive = true')
      .andWhere('p.deletedAt IS NULL')
      .getMany();
  }

  async update(id: string, merchantId: string, data: Partial<Product>): Promise<Product | null> {
    await this.repo.update({ id, merchantId }, data as any);
    return this.findOne(id, merchantId);
  }

  async softDelete(id: string, merchantId: string): Promise<void> {
    await this.repo.softDelete({ id, merchantId });
  }
}
