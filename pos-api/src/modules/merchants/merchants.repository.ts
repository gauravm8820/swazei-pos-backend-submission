import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from './entities/merchant.entity';

@Injectable()
export class MerchantsRepository {
  constructor(
    @InjectRepository(Merchant)
    private readonly repo: Repository<Merchant>,
  ) {}

  async findById(id: string): Promise<Merchant | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Merchant | null> {
    return this.repo.findOne({ where: { slug } });
  }

  async create(data: Partial<Merchant>): Promise<Merchant> {
    const merchant = this.repo.create(data);
    return this.repo.save(merchant);
  }

  async findAll(): Promise<Merchant[]> {
    return this.repo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, data: Partial<Merchant>): Promise<Merchant> {
    await this.repo.update(id, data as any);
    return this.findById(id) as Promise<Merchant>;
  }
}
