import {
  Controller, Get, Put, Param, Body, ParseUUIDPipe, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, JwtPayload } from '../../common/types/jwt-payload.type';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('stores/:storeId/inventory')
@UseGuards(StoreAccessGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @Roles(UserRole.CASHIER)
  @ApiOperation({ summary: 'List all inventory for a store' })
  async findAll(@Param('storeId', ParseUUIDPipe) storeId: string) {
    return { data: await this.inventoryService.findAll(storeId) };
  }

  @Get(':productId')
  @Roles(UserRole.CASHIER)
  @ApiOperation({ summary: 'Get stock for a specific product in a store' })
  async findOne(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return { data: await this.inventoryService.findOne(storeId, productId) };
  }

  @Put(':productId')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Set stock quantity for a product in a store' })
  async update(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateInventoryDto,
  ) {
    return {
      data: await this.inventoryService.updateStock(storeId, productId, dto),
    };
  }
}
