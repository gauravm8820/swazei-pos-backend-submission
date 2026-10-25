import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ProductsRepository } from './products.repository';
import { JwtPayload } from '../../common/types/jwt-payload.type';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const PRODUCT_TTL = 300_000; // 5 minutes in ms

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepo: ProductsRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private getMerchantId(user: JwtPayload): string {
    if (!user.merchantId) {
      throw new ForbiddenException('Merchant context required for product operations');
    }
    return user.merchantId;
  }

  private productKey(merchantId: string, id: string) {
    return `product:${merchantId}:${id}`;
  }
  private productListKey(merchantId: string) {
    return `products:merchant:${merchantId}`;
  }

  async create(user: JwtPayload, dto: CreateProductDto) {
    const merchantId = this.getMerchantId(user);
    const product = await this.productsRepo.create({
      ...dto,
      merchantId,
      currency: dto.currency || 'INR',
    });
    // Invalidate list cache
    await this.cacheManager.del(this.productListKey(merchantId));
    return product;
  }

  async findAll(user: JwtPayload) {
    const merchantId = this.getMerchantId(user);
    const cacheKey = this.productListKey(merchantId);
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) return cached;

    const products = await this.productsRepo.findAll(merchantId);
    await this.cacheManager.set(cacheKey, products, PRODUCT_TTL);
    return products;
  }

  async findOne(user: JwtPayload, id: string) {
    const merchantId = this.getMerchantId(user);
    const cacheKey = this.productKey(merchantId, id);
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    const product = await this.productsRepo.findOne(id, merchantId);
    if (!product) throw new NotFoundException('Product not found');
    await this.cacheManager.set(cacheKey, product, PRODUCT_TTL);
    return product;
  }

  async update(user: JwtPayload, id: string, dto: UpdateProductDto) {
    const merchantId = this.getMerchantId(user);
    const product = await this.productsRepo.findOne(id, merchantId);
    if (!product) throw new NotFoundException('Product not found');

    const updated = await this.productsRepo.update(id, merchantId, dto);
    // Invalidate caches
    await this.cacheManager.del(this.productKey(merchantId, id));
    await this.cacheManager.del(this.productListKey(merchantId));
    return updated;
  }

  async remove(user: JwtPayload, id: string) {
    const merchantId = this.getMerchantId(user);
    const product = await this.productsRepo.findOne(id, merchantId);
    if (!product) throw new NotFoundException('Product not found');
    await this.productsRepo.softDelete(id, merchantId);
    await this.cacheManager.del(this.productKey(merchantId, id));
    await this.cacheManager.del(this.productListKey(merchantId));
    return { message: 'Product deleted' };
  }
}
