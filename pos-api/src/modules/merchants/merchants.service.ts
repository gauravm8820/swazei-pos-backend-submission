import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { MerchantsRepository } from './merchants.repository';
import { JwtPayload, UserRole } from '../../common/types/jwt-payload.type';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class MerchantsService {
  constructor(
    private readonly merchantsRepo: MerchantsRepository,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateMerchantDto) {
    const merchantName = dto.name || dto.companyName;
    if (!merchantName) {
      throw new BadRequestException('Company name is required');
    }

    const existing = await this.merchantsRepo.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException(`Merchant with slug '${dto.slug}' already exists`);
    }

    let plan: SubscriptionPlan | null = null;
    if (dto.planId) {
      plan = await this.subscriptionsService.findPlanById(dto.planId);
    } else if (dto.planSlug) {
      plan = await this.subscriptionsService.findPlanBySlug(dto.planSlug);
    }

    if (!plan || !plan.isActive) {
      throw new NotFoundException('Selected subscription plan does not exist or is inactive');
    }

    // 1. Create Merchant Company
    const merchant = await this.merchantsRepo.create({
      name: merchantName,
      slug: dto.slug,
      isActive: true,
    });

    // 2. Hash owner password & create root Client Owner account
    const passwordHash = await bcrypt.hash(dto.ownerPassword, 10);
    const owner = await this.usersService.createOwnerForMerchant(
      merchant.id,
      dto.ownerEmail,
      passwordHash,
    );

    // 3. Assign subscription plan
    const subscription = await this.subscriptionsService.assignSubscription({
      merchantId: merchant.id,
      planId: plan.id,
      durationMonths: dto.durationMonths || plan.durationMonths,
      notes: dto.notes || `Initial onboarding subscription for ${merchantName}`,
    });

    return {
      merchant: {
        id: merchant.id,
        name: merchant.name,
        slug: merchant.slug,
        isActive: merchant.isActive,
        createdAt: merchant.createdAt,
      },
      owner: {
        id: owner.id,
        email: owner.email,
        role: owner.role,
      },
      subscription: {
        id: subscription.id,
        status: subscription.status,
        planName: plan.name,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        durationMonths: dto.durationMonths || plan.durationMonths,
        maxStores: plan.maxStores,
        maxUsers: plan.maxUsers,
      },
    };
  }

  async findAll() {
    const merchants = await this.merchantsRepo.findAll();
    return Promise.all(
      merchants.map(async (m) => {
        const subscription = await this.subscriptionsService.getActiveSubscription(m.id);
        const userCount = await this.usersService.countByMerchant(m.id);
        return {
          id: m.id,
          name: m.name,
          slug: m.slug,
          isActive: m.isActive,
          createdAt: m.createdAt,
          userCount,
          subscription: subscription
            ? {
                planName: subscription.plan.name,
                status: subscription.status,
                remainingDays: subscription.remainingDays,
                endDate: subscription.endDate,
                maxStores: subscription.plan.maxStores,
                maxUsers: subscription.plan.maxUsers,
              }
            : null,
        };
      }),
    );
  }

  async findMe(user: JwtPayload) {
    if (!user.merchantId) {
      return {
        message: 'Platform Super Admin operates at the global system level (no single merchant scope)',
        role: user.role,
      };
    }

    const merchant = await this.merchantsRepo.findById(user.merchantId);
    if (!merchant) throw new NotFoundException('Merchant not found');

    const subscription = await this.subscriptionsService.getActiveSubscription(user.merchantId);
    return {
      ...merchant,
      subscription,
    };
  }

  async update(user: JwtPayload, dto: UpdateMerchantDto) {
    if (user.role !== UserRole.OWNER && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only the OWNER or SUPER_ADMIN can update merchant details');
    }
    const merchantId = user.merchantId;
    if (!merchantId) throw new NotFoundException('Merchant context not found');

    const merchant = await this.merchantsRepo.findById(merchantId);
    if (!merchant) throw new NotFoundException('Merchant not found');
    return this.merchantsRepo.update(merchantId, dto);
  }
}
