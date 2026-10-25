import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserRole } from '../../../common/types/jwt-payload.type';
import { Merchant } from '../../merchants/entities/merchant.entity';
import { Store } from '../../stores/entities/store.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  merchantId: string | null;

  @Column({ type: 'uuid', nullable: true })
  storeId: string | null;

  @Column({ type: 'varchar', length: 254, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Merchant, (m) => m.users, { nullable: true })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant | null;

  @ManyToOne(() => Store, (s) => s.users, { nullable: true })
  @JoinColumn({ name: 'storeId' })
  store: Store | null;
}
