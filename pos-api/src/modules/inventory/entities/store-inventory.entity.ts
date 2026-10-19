import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Check,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('store_inventory')
@Unique(['storeId', 'productId'])
@Check('"quantity" >= 0')
export class StoreInventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'integer', default: 0 })
  quantity: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Store, (s) => s.inventory)
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @ManyToOne(() => Product, (p) => p.inventory)
  @JoinColumn({ name: 'productId' })
  product: Product;
}
