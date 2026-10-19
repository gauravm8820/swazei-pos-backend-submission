import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { JwtPayload, UserRole } from '../../common/types/jwt-payload.type';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

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

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const newUser = await this.usersRepo.create({
      email: dto.email,
      passwordHash,
      role: dto.role,
      merchantId: user.merchantId,
      storeId: dto.storeId || null,
    });

    const { passwordHash: _, ...result } = newUser as any;
    return result;
  }

  async findAll(user: JwtPayload) {
    return this.usersRepo.findAll(user.merchantId);
  }

  async findOne(user: JwtPayload, userId: string) {
    const found = await this.usersRepo.findByIdAndMerchant(userId, user.merchantId);
    if (!found) throw new NotFoundException('User not found');
    const { passwordHash: _, ...result } = found as any;
    return result;
  }

  async softDelete(user: JwtPayload, userId: string) {
    const found = await this.usersRepo.findByIdAndMerchant(userId, user.merchantId);
    if (!found) throw new NotFoundException('User not found');
    await this.usersRepo.softDelete(userId, user.merchantId);
    return { message: 'User deleted' };
  }

  // Used internally by AuthService
  async findByEmail(email: string) {
    return this.usersRepo.findByEmail(email);
  }
}
