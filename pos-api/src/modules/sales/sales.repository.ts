import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Payment } from './entities/payment.entity';

@Injectable()
export class SalesRepository {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepo: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly saleItemRepo: Repository<SaleItem>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly dataSource: DataSource,
  ) {}

  get ds(): DataSource {
    return this.dataSource;
  }

  async findAll(storeId: string): Promise<Sale[]> {
    return this.saleRepo.find({
      where: { storeId },
      relations: ['items', 'payment', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, storeId: string): Promise<Sale | null> {
    return this.saleRepo.findOne({
      where: { id, storeId },
      relations: ['items', 'payment', 'items.product', 'cashier'],
    });
  }
}
