import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MerchantsService } from './merchants.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, JwtPayload } from '../../common/types/jwt-payload.type';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';

@ApiTags('Merchants')
@ApiBearerAuth()
@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Onboard a new client company with subscription & initial Owner (Super Admin only)' })
  async create(@Body() dto: CreateMerchantDto) {
    return { data: await this.merchantsService.create(dto) };
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all client companies and their subscription health (Super Admin only)' })
  async findAll() {
    return { data: await this.merchantsService.findAll() };
  }

  @Get('me')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get own company profile and active subscription details' })
  async getMe(@CurrentUser() user: JwtPayload) {
    return { data: await this.merchantsService.findMe(user) };
  }

  @Patch('me')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Update merchant corporate details (OWNER only)' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateMerchantDto,
  ) {
    return { data: await this.merchantsService.update(user, dto) };
  }
}
