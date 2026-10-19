import {
  Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, JwtPayload } from '../../common/types/jwt-payload.type';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a product in merchant catalog' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateProductDto) {
    return { data: await this.productsService.create(user, dto) };
  }

  @Get()
  @Roles(UserRole.CASHIER)
  @ApiOperation({ summary: 'List all products for merchant (cached)' })
  async findAll(@CurrentUser() user: JwtPayload) {
    return { data: await this.productsService.findAll(user) };
  }

  @Get(':productId')
  @Roles(UserRole.CASHIER)
  @ApiOperation({ summary: 'Get a product by ID (cached)' })
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return { data: await this.productsService.findOne(user, productId) };
  }

  @Patch(':productId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a product (invalidates cache)' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return { data: await this.productsService.update(user, productId, dto) };
  }

  @Delete(':productId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft-delete a product' })
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.productsService.remove(user, productId);
  }
}
