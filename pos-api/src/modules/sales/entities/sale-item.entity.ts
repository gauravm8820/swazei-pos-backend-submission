import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { Sale } from './sale.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('sale_items')
@Check('"quantity" >= 1')
@Check('"subtotal_minor_units" >= 0')
export class SaleItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  saleId: string;

  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ type: 'bigint' })
  unitPriceSnapshot: number;

  @Column({ type: 'bigint' })
  subtotalMinorUnits: number;

  @ManyToOne(() => Sale, (s) => s.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'saleId' })
  sale: Sale;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;
}
