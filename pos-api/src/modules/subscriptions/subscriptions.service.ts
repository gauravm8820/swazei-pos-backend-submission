import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import {
  MerchantSubscription,
  SubscriptionStatus,
} from './entities/merchant-subscription.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(MerchantSubscription)
    private readonly subRepo: Repository<MerchantSubscription>,
    @InjectRepository(Merchant)
    private readonly merchantRepo: Repository<Merchant>,
  ) {}

  // ── Plan Management (Super Admin) ──────────────────────────────────────────

  async createPlan(dto: CreatePlanDto): Promise<SubscriptionPlan> {
    const existing = await this.planRepo.findOne({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException(`Plan with slug '${dto.slug}' already exists`);
    }

    const plan = this.planRepo.create({
      ...dto,
      currency: dto.currency || 'INR',
      features: dto.features || [],
    });
    return this.planRepo.save(plan);
  }

  async findAllPlans(): Promise<SubscriptionPlan[]> {
    return this.planRepo.find({
      order: { priceMinorUnits: 'ASC' },
    });
  }

  async findPlanById(id: string): Promise<SubscriptionPlan> {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Subscription plan not found');
    return plan;
  }

  async findPlanBySlug(slug: string): Promise<SubscriptionPlan | null> {
    return this.planRepo.findOne({ where: { slug } });
  }

  async updatePlan(id: string, dto: UpdatePlanDto): Promise<SubscriptionPlan> {
    const plan = await this.findPlanById(id);
    Object.assign(plan, dto);
    return this.planRepo.save(plan);
  }

  // ── Merchant Subscription Management ───────────────────────────────────────

  async assignSubscription(dto: AssignSubscriptionDto): Promise<MerchantSubscription> {
    const merchant = await this.merchantRepo.findOne({ where: { id: dto.merchantId } });
    if (!merchant) throw new NotFoundException('Merchant not found');

    let plan: SubscriptionPlan | null = null;
    if (dto.planId) {
      plan = await this.planRepo.findOne({ where: { id: dto.planId } });
    } else if (dto.planSlug) {
      plan = await this.findPlanBySlug(dto.planSlug);
    }

    if (!plan) throw new NotFoundException('Subscription plan not found');
    if (!plan.isActive) throw new BadRequestException('Selected plan is inactive');

    const durationMonths = dto.durationMonths || plan.durationMonths;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000);

    // Expire/cancel any existing active subscriptions for this merchant
    await this.subRepo.update(
      { merchantId: dto.merchantId, status: SubscriptionStatus.ACTIVE },
      { status: SubscriptionStatus.CANCELLED },
    );

    const subscription = this.subRepo.create({
      merchantId: dto.merchantId,
      planId: plan.id,
      status: SubscriptionStatus.ACTIVE,
      startDate,
      endDate,
      autoRenew: dto.autoRenew ?? false,
      notes: dto.notes || null,
    });

    const saved = await this.subRepo.save(subscription);
    return {
      ...saved,
      plan,
    } as any;
  }

  async getActiveSubscription(merchantId: string) {
    const sub = await this.subRepo.findOne({
      where: { merchantId, status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });

    if (!sub) return null;

    const now = new Date();
    const isExpired = now > sub.endDate;
    if (isExpired && sub.status === SubscriptionStatus.ACTIVE) {
      sub.status = SubscriptionStatus.EXPIRED;
      await this.subRepo.save(sub);
    }

    const remainingDays = Math.max(
      0,
      Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    );

    return {
      id: sub.id,
      merchantId: sub.merchantId,
      status: sub.status,
      startDate: sub.startDate,
      endDate: sub.endDate,
      remainingDays,
      autoRenew: sub.autoRenew,
      plan: {
        id: sub.plan.id,
        name: sub.plan.name,
        slug: sub.plan.slug,
        priceMinorUnits: sub.plan.priceMinorUnits,
        currency: sub.plan.currency,
        durationMonths: sub.plan.durationMonths,
        maxStores: sub.plan.maxStores,
        maxUsers: sub.plan.maxUsers,
        features: sub.plan.features,
      },
    };
  }

  async validateActiveSubscription(merchantId: string) {
    const activeSub = await this.getActiveSubscription(merchantId);
    if (!activeSub || activeSub.status !== SubscriptionStatus.ACTIVE) {
      throw new ForbiddenException(
        'Company subscription is inactive or expired. Please contact platform administrator.',
      );
    }
    return activeSub;
  }

  async checkCanAddStore(merchantId: string, currentStoreCount: number) {
    const sub = await this.validateActiveSubscription(merchantId);
    if (currentStoreCount >= sub.plan.maxStores) {
      throw new ForbiddenException(
        `Subscription store limit reached (${sub.plan.maxStores} stores maximum). Please upgrade your plan.`,
      );
    }
  }

  async checkCanAddUser(merchantId: string, currentUserCount: number) {
    const sub = await this.validateActiveSubscription(merchantId);
    if (currentUserCount >= sub.plan.maxUsers) {
      throw new ForbiddenException(
        `Subscription user limit reached (${sub.plan.maxUsers} users maximum). Please upgrade your plan.`,
      );
    }
  }
}
