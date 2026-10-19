import {
  Controller, Get, Post, Body, Param, ParseUUIDPipe, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, JwtPayload } from '../../common/types/jwt-payload.type';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor';

@ApiTags('Sales')
@ApiBearerAuth()
@Controller('stores/:storeId/sales')
@UseGuards(StoreAccessGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles(UserRole.CASHIER)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({ summary: 'Create a sale (requires Idempotency-Key header)' })
  @ApiHeader({
    name: 'Idempotency-Key',
    description: 'Unique key to prevent duplicate sale creation (UUID recommended)',
    required: true,
  })
  async create(
    @CurrentUser() user: JwtPayload,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() dto: CreateSaleDto,
  ) {
    const sale = await this.salesService.createSale(dto, user, storeId);
    return { data: sale };
  }

  @Get()
  @Roles(UserRole.CASHIER)
  @ApiOperation({ summary: 'List all sales for a store' })
  async findAll(@Param('storeId', ParseUUIDPipe) storeId: string) {
    return { data: await this.salesService.findAll(storeId) };
  }

  @Get(':saleId')
  @Roles(UserRole.CASHIER)
  @ApiOperation({ summary: 'Get a sale by ID with items and payment' })
  async findOne(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('saleId', ParseUUIDPipe) saleId: string,
  ) {
    return { data: await this.salesService.findOne(storeId, saleId) };
  }
}
