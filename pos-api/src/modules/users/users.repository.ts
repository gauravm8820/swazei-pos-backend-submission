import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from '../../common/types/jwt-payload.type';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async create(data: Partial<User>): Promise<User> {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({
      where: { email, deletedAt: IsNull() },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id, deletedAt: IsNull() } });
  }

  async findByIdAndMerchant(id: string, merchantId: string): Promise<User | null> {
    return this.repo.findOne({
      where: { id, merchantId, deletedAt: IsNull() },
    });
  }

  async findAll(merchantId: string): Promise<User[]> {
    return this.repo.find({
      where: { merchantId, deletedAt: IsNull() },
      select: ['id', 'email', 'role', 'storeId', 'isActive', 'createdAt'],
    });
  }

  async softDelete(id: string, merchantId: string): Promise<void> {
    await this.repo.softDelete({ id, merchantId });
  }

  async update(id: string, merchantId: string, data: Partial<User>): Promise<User | null> {
    await this.repo.update({ id, merchantId }, data as any);
    return this.findByIdAndMerchant(id, merchantId);
  }

  async countByMerchant(merchantId: string): Promise<number> {
    return this.repo.count({ where: { merchantId, deletedAt: IsNull() } });
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.repo.find({ where: { role, deletedAt: IsNull() } });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.repo.update(id, { passwordHash });
  }
}
