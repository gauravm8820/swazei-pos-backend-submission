import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, JwtPayload } from '../../common/types/jwt-payload.type';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';

@ApiTags('Stores')
@ApiBearerAuth()
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new store' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateStoreDto) {
    return { data: await this.storesService.create(user, dto) };
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all stores for merchant' })
  async findAll(@CurrentUser() user: JwtPayload) {
    return { data: await this.storesService.findAll(user) };
  }

  @Get(':storeId')
  @Roles(UserRole.MANAGER)
  @UseGuards(StoreAccessGuard)
  @ApiOperation({ summary: 'Get a store by ID' })
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ) {
    return { data: await this.storesService.findOne(user, storeId) };
  }

  @Patch(':storeId')
  @Roles(UserRole.ADMIN)
  @UseGuards(StoreAccessGuard)
  @ApiOperation({ summary: 'Update a store' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() dto: Partial<CreateStoreDto>,
  ) {
    return { data: await this.storesService.update(user, storeId, dto) };
  }

  @Delete(':storeId')
  @Roles(UserRole.OWNER)
  @UseGuards(StoreAccessGuard)
  @ApiOperation({ summary: 'Deactivate a store' })
  async deactivate(
    @CurrentUser() user: JwtPayload,
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ) {
    return { data: await this.storesService.deactivate(user, storeId) };
  }
}
