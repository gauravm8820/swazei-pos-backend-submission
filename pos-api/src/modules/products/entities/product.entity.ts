import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Merchant } from '../../merchants/entities/merchant.entity';
import { StoreInventory } from '../../inventory/entities/store-inventory.entity';
import { SaleItem } from '../../sales/entities/sale-item.entity';

@Entity('products')
@Unique(['merchantId', 'sku'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  merchantId: string;

  @Column({ type: 'varchar', length: 300 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'bigint' })
  priceMinorUnits: number;

  @Column({ type: 'varchar', length: 3, default: 'INR' })
  currency: string;

  @Column({ type: 'varchar', length: 100 })
  sku: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Merchant, (m) => m.products)
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;

  @OneToMany(() => StoreInventory, (inv) => inv.product)
  inventory: StoreInventory[];

  @OneToMany(() => SaleItem, (si) => si.product)
  saleItems: SaleItem[];
}
