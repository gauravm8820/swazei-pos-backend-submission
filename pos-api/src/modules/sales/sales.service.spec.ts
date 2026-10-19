import { Test, TestingModule } from '@nestjs/testing';
import { UnprocessableEntityException, HttpException, HttpStatus } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SalesService } from './sales.service';
import { SalesRepository } from './sales.repository';
import { InventoryRepository } from '../inventory/inventory.repository';
import { ProductsRepository } from '../products/products.repository';
import { PAYMENT_PORT, PaymentPort } from '../payments/payment.port';
import { JwtPayload, UserRole } from '../../common/types/jwt-payload.type';
import { SaleStatus } from './entities/sale.entity';

describe('SalesService (Unit Tests)', () => {
  let service: SalesService;
  let productsRepo: jest.Mocked<Partial<ProductsRepository>>;
  let inventoryRepo: jest.Mocked<Partial<InventoryRepository>>;
  let salesRepo: jest.Mocked<Partial<SalesRepository>>;
  let paymentPort: jest.Mocked<PaymentPort>;
  let dataSource: jest.Mocked<Partial<DataSource>>;

  const mockUser: JwtPayload = {
    sub: 'user-uuid-1',
    merchantId: 'merchant-uuid-1',
    storeId: 'store-uuid-1',
    role: UserRole.CASHIER,
  };

  const storeId = 'store-uuid-1';
  const productId = 'prod-uuid-1';

  beforeEach(async () => {
    productsRepo = {
      findByIds: jest.fn(),
    };
    inventoryRepo = {
      lockAndFetchForUpdate: jest.fn(),
      decrementBatch: jest.fn(),
      incrementBatch: jest.fn(),
    };
    salesRepo = {
      findOne: jest.fn(),
      findAll: jest.fn(),
    };
    paymentPort = {
      charge: jest.fn(),
    };
    dataSource = {
      transaction: jest.fn().mockImplementation(async (cb) => {
        const emMock: any = {
          create: jest.fn().mockImplementation((entityClass, data) => ({ ...data, id: 'sale-uuid-1' })),
          save: jest.fn().mockImplementation(async (entityClass, data) => data),
          update: jest.fn().mockResolvedValue({ affected: 1 }),
        };
        return cb(emMock);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: ProductsRepository, useValue: productsRepo },
        { provide: InventoryRepository, useValue: inventoryRepo },
        { provide: SalesRepository, useValue: salesRepo },
        { provide: PAYMENT_PORT, useValue: paymentPort },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
  });

  it('throws 422 when a product is not found in the merchant catalog', async () => {
    productsRepo.findByIds = jest.fn().mockResolvedValue([]); // Product not in merchant catalog

    await expect(
      service.createSale(
        { items: [{ productId, quantity: 1 }] },
        mockUser,
        storeId,
      ),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('throws 422 when stock is insufficient', async () => {
    productsRepo.findByIds = jest.fn().mockResolvedValue([
      { id: productId, name: 'Espresso', priceMinorUnits: 15000, currency: 'INR' },
    ]);
    inventoryRepo.lockAndFetchForUpdate = jest.fn().mockResolvedValue([
      { productId, quantity: 2 }, // only 2 available
    ]);

    await expect(
      service.createSale(
        { items: [{ productId, quantity: 5 }] }, // requesting 5
        mockUser,
        storeId,
      ),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('creates a sale with PAID status on successful payment', async () => {
    const product = { id: productId, name: 'Espresso', priceMinorUnits: 15000, currency: 'INR' };
    productsRepo.findByIds = jest.fn().mockResolvedValue([product]);
    inventoryRepo.lockAndFetchForUpdate = jest.fn().mockResolvedValue([
      { productId, quantity: 10 },
    ]);
    paymentPort.charge = jest.fn().mockResolvedValue({
      status: 'SUCCESS',
      providerReference: 'mock_tx_123',
      rawResponse: { authorized: true },
    });
    salesRepo.findOne = jest.fn().mockResolvedValue({
      id: 'sale-uuid-1',
      status: SaleStatus.PAID,
      totalMinorUnits: 30000,
    } as any);

    const result = await service.createSale(
      { items: [{ productId, quantity: 2 }] },
      mockUser,
      storeId,
    );

    expect(result.status).toBe(SaleStatus.PAID);
    expect(paymentPort.charge).toHaveBeenCalledTimes(1);
    expect(inventoryRepo.decrementBatch).toHaveBeenCalledTimes(1);
  });

  it('compensates inventory and throws 402 on failed payment', async () => {
    const product = { id: productId, name: 'Espresso', priceMinorUnits: 15000, currency: 'INR' };
    productsRepo.findByIds = jest.fn().mockResolvedValue([product]);
    inventoryRepo.lockAndFetchForUpdate = jest.fn().mockResolvedValue([
      { productId, quantity: 10 },
    ]);
    paymentPort.charge = jest.fn().mockResolvedValue({
      status: 'FAILED',
      providerReference: 'mock_fail_123',
      rawResponse: { error: 'declined' },
      failureReason: 'INSUFFICIENT_FUNDS',
    });
    salesRepo.findOne = jest.fn().mockResolvedValue({
      id: 'sale-uuid-1',
      status: SaleStatus.FAILED,
    } as any);

    await expect(
      service.createSale(
        { items: [{ productId, quantity: 2 }] },
        mockUser,
        storeId,
      ),
    ).rejects.toThrow(HttpException);

    // Verify compensation transaction incremented inventory back
    expect(inventoryRepo.incrementBatch).toHaveBeenCalledTimes(1);
  });
});
