import {
  Injectable,
  NotFoundException,
  ConflictException,
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

  private productKey(merchantId: string, id: string) {
    return `product:${merchantId}:${id}`;
  }
  private productListKey(merchantId: string) {
    return `products:merchant:${merchantId}`;
  }

  async create(user: JwtPayload, dto: CreateProductDto) {
    const product = await this.productsRepo.create({
      ...dto,
      merchantId: user.merchantId,
      currency: dto.currency || 'INR',
    });
    // Invalidate list cache
    await this.cacheManager.del(this.productListKey(user.merchantId));
    return product;
  }

  async findAll(user: JwtPayload) {
    const cacheKey = this.productListKey(user.merchantId);
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) return cached;

    const products = await this.productsRepo.findAll(user.merchantId);
    await this.cacheManager.set(cacheKey, products, PRODUCT_TTL);
    return products;
  }

  async findOne(user: JwtPayload, id: string) {
    const cacheKey = this.productKey(user.merchantId, id);
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    const product = await this.productsRepo.findOne(id, user.merchantId);
    if (!product) throw new NotFoundException('Product not found');
    await this.cacheManager.set(cacheKey, product, PRODUCT_TTL);
    return product;
  }

  async update(user: JwtPayload, id: string, dto: UpdateProductDto) {
    const product = await this.productsRepo.findOne(id, user.merchantId);
    if (!product) throw new NotFoundException('Product not found');

    const updated = await this.productsRepo.update(id, user.merchantId, dto);
    // Invalidate caches
    await this.cacheManager.del(this.productKey(user.merchantId, id));
    await this.cacheManager.del(this.productListKey(user.merchantId));
    return updated;
  }

  async remove(user: JwtPayload, id: string) {
    const product = await this.productsRepo.findOne(id, user.merchantId);
    if (!product) throw new NotFoundException('Product not found');
    await this.productsRepo.softDelete(id, user.merchantId);
    await this.cacheManager.del(this.productKey(user.merchantId, id));
    await this.cacheManager.del(this.productListKey(user.merchantId));
    return { message: 'Product deleted' };
  }
}
