import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';

@Injectable()
export class StoresRepository {
  constructor(
    @InjectRepository(Store)
    private readonly repo: Repository<Store>,
  ) {}

  async create(data: Partial<Store>): Promise<Store> {
    const store = this.repo.create(data);
    return this.repo.save(store);
  }

  async findAll(merchantId: string): Promise<Store[]> {
    return this.repo.find({ where: { merchantId, isActive: true } });
  }

  async findOne(id: string, merchantId: string): Promise<Store | null> {
    return this.repo.findOne({ where: { id, merchantId } });
  }

  async update(id: string, merchantId: string, data: Partial<Store>): Promise<Store | null> {
    await this.repo.update({ id, merchantId }, data as any);
    return this.findOne(id, merchantId);
  }
}
