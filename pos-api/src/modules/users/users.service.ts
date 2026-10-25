import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { JwtPayload, UserRole } from '../../common/types/jwt-payload.type';
import { CreateUserDto } from './dto/create-user.dto';

import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  private getMerchantId(user: JwtPayload): string {
    if (!user.merchantId) {
      throw new ForbiddenException('Merchant context required for this operation');
    }
    return user.merchantId;
  }

  async create(user: JwtPayload, dto: CreateUserDto) {
    const existing = await this.usersRepo.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');

    // MANAGER and CASHIER must have a storeId
    if (
      (dto.role === UserRole.MANAGER || dto.role === UserRole.CASHIER) &&
      !dto.storeId
    ) {
      throw new BadRequestException(`${dto.role} must be assigned to a store`);
    }

    // Check subscription limits for merchant staff
    if (user.role !== UserRole.SUPER_ADMIN && user.merchantId) {
      const currentCount = await this.usersRepo.countByMerchant(user.merchantId);
      await this.subscriptionsService.checkCanAddUser(user.merchantId, currentCount);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const newUser = await this.usersRepo.create({
      email: dto.email,
      passwordHash,
      role: dto.role,
      merchantId: user.merchantId ?? null,
      storeId: dto.storeId || null,
    });

    const { passwordHash: _, ...result } = newUser as any;
    return result;
  }

  async findAll(user: JwtPayload) {
    const merchantId = this.getMerchantId(user);
    return this.usersRepo.findAll(merchantId);
  }

  async findOne(user: JwtPayload, userId: string) {
    const merchantId = this.getMerchantId(user);
    const found = await this.usersRepo.findByIdAndMerchant(userId, merchantId);
    if (!found) throw new NotFoundException('User not found');
    const { passwordHash: _, ...result } = found as any;
    return result;
  }

  async softDelete(user: JwtPayload, userId: string) {
    const merchantId = this.getMerchantId(user);
    const found = await this.usersRepo.findByIdAndMerchant(userId, merchantId);
    if (!found) throw new NotFoundException('User not found');
    await this.usersRepo.softDelete(userId, merchantId);
    return { message: 'User deleted' };
  }

  // Used internally by AuthService & SuperAdmin setup
  async findByEmail(email: string) {
    return this.usersRepo.findByEmail(email);
  }

  async findSuperAdmins() {
    return this.usersRepo.findByRole(UserRole.SUPER_ADMIN);
  }

  async createSuperAdmin(email: string, passwordHash: string) {
    const existing = await this.usersRepo.findByEmail(email);
    if (existing) throw new ConflictException('Email already in use');

    return this.usersRepo.create({
      email,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      merchantId: null,
      storeId: null,
      isActive: true,
    });
  }

  async createOwnerForMerchant(merchantId: string, email: string, passwordHash: string) {
    const existing = await this.usersRepo.findByEmail(email);
    if (existing) throw new ConflictException('Email already in use');

    return this.usersRepo.create({
      email,
      passwordHash,
      role: UserRole.OWNER,
      merchantId,
      storeId: null,
      isActive: true,
    });
  }

  async countByMerchant(merchantId: string): Promise<number> {
    return this.usersRepo.countByMerchant(merchantId);
  }
}
