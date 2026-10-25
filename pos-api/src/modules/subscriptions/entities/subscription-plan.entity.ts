import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { MerchantSubscription } from './merchant-subscription.entity';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'bigint', default: 0 })
  priceMinorUnits: number;

  @Column({ type: 'varchar', length: 3, default: 'INR' })
  currency: string;

  @Column({ type: 'int', default: 1 })
  durationMonths: number;

  @Column({ type: 'int', default: 1 })
  maxStores: number;

  @Column({ type: 'int', default: 5 })
  maxUsers: number;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  features: string[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => MerchantSubscription, (ms) => ms.plan)
  subscriptions: MerchantSubscription[];
}
