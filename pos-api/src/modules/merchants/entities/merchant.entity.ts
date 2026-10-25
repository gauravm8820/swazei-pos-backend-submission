import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import { MerchantSubscription } from '../../subscriptions/entities/merchant-subscription.entity';

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Store, (store) => store.merchant)
  stores: Store[];

  @OneToMany(() => User, (user) => user.merchant)
  users: User[];

  @OneToMany(() => Product, (product) => product.merchant)
  products: Product[];

  @OneToMany(() => MerchantSubscription, (sub) => sub.merchant)
  subscriptions: MerchantSubscription[];
}
