import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../common/types/jwt-payload.type';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('plans')
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new subscription plan (Super Admin only)' })
  async createPlan(@Body() dto: CreatePlanDto) {
    return { data: await this.subscriptionsService.createPlan(dto) };
  }

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'List all subscription plans (Public catalog)' })
  async findAllPlans() {
    return { data: await this.subscriptionsService.findAllPlans() };
  }

  @Public()
  @Get('plans/:id')
  @ApiOperation({ summary: 'Get subscription plan details by ID' })
  async findPlanById(@Param('id', ParseUUIDPipe) id: string) {
    return { data: await this.subscriptionsService.findPlanById(id) };
  }

  @Patch('plans/:id')
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a subscription plan (Super Admin only)' })
  async updatePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return { data: await this.subscriptionsService.updatePlan(id, dto) };
  }

  @Post('assign')
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign or renew subscription for a client company (Super Admin only)' })
  async assignSubscription(@Body() dto: AssignSubscriptionDto) {
    return { data: await this.subscriptionsService.assignSubscription(dto) };
  }
}
