import {
  Injectable,
  Inject,
  UnprocessableEntityException,
  NotFoundException,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { SalesRepository } from './sales.repository';
import { InventoryRepository } from '../inventory/inventory.repository';
import { ProductsRepository } from '../products/products.repository';
import { PaymentPort, PAYMENT_PORT } from '../payments/payment.port';
import { JwtPayload } from '../../common/types/jwt-payload.type';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Sale, SaleStatus } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Payment, PaymentStatus } from './entities/payment.entity';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private readonly salesRepo: SalesRepository,
    private readonly inventoryRepo: InventoryRepository,
    private readonly productsRepo: ProductsRepository,
    @Inject(PAYMENT_PORT) private readonly paymentPort: PaymentPort,
    private readonly dataSource: DataSource,
  ) {}

  async createSale(dto: CreateSaleDto, user: JwtPayload, storeId: string): Promise<Sale> {
    // ── STEP 1: Validate products exist in this merchant's catalog ─────────
    const productIds = dto.items.map((i) => i.productId);

    const products = await this.productsRepo.findByIds(productIds, user.merchantId);
    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missing = productIds.filter((id) => !foundIds.has(id));
      throw new UnprocessableEntityException(
        `Products not found in this merchant's catalog: ${missing.join(', ')}`,
      );
    }
    const productMap = new Map(products.map((p) => [p.id, p]));

    // ── STEP 2: Begin DB transaction — lock inventory and decrement ────────
    let sale!: Sale;

    await this.dataSource.transaction(async (em: EntityManager) => {
      // Sort product IDs ascending to prevent deadlocks (consistent lock order)
      const sortedProductIds = [...productIds].sort();

      // Lock inventory rows with SELECT FOR UPDATE
      const lockedInventory = await this.inventoryRepo.lockAndFetchForUpdate(
        em,
        storeId,
        sortedProductIds,
      );

      const inventoryMap = new Map(lockedInventory.map((inv) => [inv.productId, inv]));

      // Validate stock for each requested item
      for (const item of dto.items) {
        const inv = inventoryMap.get(item.productId);
        if (!inv) {
          throw new UnprocessableEntityException(
            `Product ${item.productId} is not stocked in this store`,
          );
        }
        if (inv.quantity < item.quantity) {
          const product = productMap.get(item.productId)!;
          throw new UnprocessableEntityException(
            `Insufficient inventory for "${product.name}": available ${inv.quantity}, requested ${item.quantity}`,
          );
        }
      }

      // Calculate server-side total
      const totalMinorUnits = dto.items.reduce((sum, item) => {
        const product = productMap.get(item.productId)!;
        return sum + Number(product.priceMinorUnits) * item.quantity;
      }, 0);

      const currency = products[0].currency;

      // Insert Sale (PENDING)
      const newSale = em.create(Sale, {
        storeId,
        cashierId: user.sub,
        status: SaleStatus.PENDING,
        totalMinorUnits,
        currency,
      });
      sale = await em.save(Sale, newSale);

      // Insert SaleItems with price snapshots
      const saleItems = dto.items.map((item) => {
        const product = productMap.get(item.productId)!;
        const unitPrice = Number(product.priceMinorUnits);
        return em.create(SaleItem, {
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPriceSnapshot: unitPrice,
          subtotalMinorUnits: unitPrice * item.quantity,
        });
      });
      await em.save(SaleItem, saleItems);

      // Decrement inventory
      const decrements = dto.items.map((item) => ({
        storeId,
        productId: item.productId,
        qty: item.quantity,
      }));
      await this.inventoryRepo.decrementBatch(em, decrements);
    });

    // ── STEP 3: Call payment provider OUTSIDE the DB transaction ─────────
    //    (keeps lock time minimal — only held during inventory validation+decrement)
    let paymentResult;
    try {
      paymentResult = await this.paymentPort.charge({
        saleId: sale.id,
        amountMinorUnits: sale.totalMinorUnits,
        currency: sale.currency,
        description: `Sale ${sale.id}`,
        metadata: dto.paymentMetadata,
      });
    } catch (err) {
      // Payment provider threw an unexpected error — treat as failure
      this.logger.error(`Payment provider error for sale ${sale.id}:`, err);
      paymentResult = {
        status: 'FAILED' as const,
        providerReference: `error_${Date.now()}`,
        rawResponse: { error: 'Payment provider unreachable' },
        failureReason: 'PROVIDER_ERROR',
      };
    }

    // ── STEP 4: Handle payment outcome ────────────────────────────────────
    if (paymentResult.status === 'SUCCESS') {
      // Mark sale as PAID and record payment
      await this.dataSource.transaction(async (em: EntityManager) => {
        await em.update(Sale, { id: sale.id }, { status: SaleStatus.PAID });
        await em.save(Payment, em.create(Payment, {
          saleId: sale.id,
          status: PaymentStatus.SUCCESS,
          provider: 'mock',
          providerReference: paymentResult.providerReference,
          amountMinorUnits: sale.totalMinorUnits,
          currency: sale.currency,
          providerResponse: paymentResult.rawResponse,
        }));
      });
      sale.status = SaleStatus.PAID;
    } else {
      // COMPENSATION: Restore inventory and mark sale as FAILED
      await this.dataSource.transaction(async (em: EntityManager) => {
        await em.update(Sale, { id: sale.id }, { status: SaleStatus.FAILED });
        await em.save(Payment, em.create(Payment, {
          saleId: sale.id,
          status: PaymentStatus.FAILED,
          provider: 'mock',
          providerReference: paymentResult.providerReference,
          amountMinorUnits: sale.totalMinorUnits,
          currency: sale.currency,
          providerResponse: paymentResult.rawResponse,
          failureReason: paymentResult.failureReason,
        }));
        // Restore inventory
        const increments = dto.items.map((item) => ({
          storeId,
          productId: item.productId,
          qty: item.quantity,
        }));
        await this.inventoryRepo.incrementBatch(em, increments);
      });

      sale.status = SaleStatus.FAILED;

      // Load items and payment for the response
      const fullSale = await this.salesRepo.findOne(sale.id, storeId);
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          error: 'PAYMENT_FAILED',
          message: `Payment failed: ${paymentResult.failureReason || 'Provider declined'}`,
          data: fullSale,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    // Return full sale with items and payment
    const fullSale = await this.salesRepo.findOne(sale.id, storeId);
    return fullSale!;
  }

  async findAll(storeId: string): Promise<Sale[]> {
    return this.salesRepo.findAll(storeId);
  }

  async findOne(storeId: string, saleId: string): Promise<Sale> {
    const sale = await this.salesRepo.findOne(saleId, storeId);
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }
}
