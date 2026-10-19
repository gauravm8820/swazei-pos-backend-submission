import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Merchant } from '../../merchants/entities/merchant.entity';
import { User } from '../../users/entities/user.entity';
import { StoreInventory } from '../../inventory/entities/store-inventory.entity';
import { Sale } from '../../sales/entities/sale.entity';

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  merchantId: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Merchant, (m) => m.stores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;

  @OneToMany(() => User, (u) => u.store)
  users: User[];

  @OneToMany(() => StoreInventory, (inv) => inv.store)
  inventory: StoreInventory[];

  @OneToMany(() => Sale, (s) => s.store)
  sales: Sale[];
}
