import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';
import { SalesService } from './sales.service';
import { SEED_CONSTANTS } from '../../database/seeds/seed-constants';
import { runSeed } from '../../database/seeds/seed';
import { JwtPayload, UserRole } from '../../common/types/jwt-payload.type';

describe('Concurrent Sales & Stock Race Condition (BONUS Concurrency Test)', () => {
  let module: TestingModule;
  let salesService: SalesService;
  let dataSource: DataSource;

  const storeId = SEED_CONSTANTS.STORE_1.id;
  const productId = SEED_CONSTANTS.PRODUCTS.A1.id; // Espresso Beans, initial seeded stock = 5

  const cashierPayloadA: JwtPayload = {
    sub: SEED_CONSTANTS.USERS.CASHIER_S1.id,
    merchantId: SEED_CONSTANTS.MERCHANT_A.id,
    storeId,
    role: UserRole.CASHIER,
  };

  const cashierPayloadB: JwtPayload = {
    sub: '11111111-1111-0000-0000-000000000099', // POS Terminal B
    merchantId: SEED_CONSTANTS.MERCHANT_A.id,
    storeId,
    role: UserRole.CASHIER,
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    salesService = module.get<SalesService>(SalesService);
    dataSource = module.get<DataSource>(DataSource);

    // Reset database and seed initial state (Product A1 has quantity = 5 in Store 1)
    await dataSource.query(`
      TRUNCATE TABLE "idempotency_keys", "payments", "sale_items", "sales",
                     "store_inventory", "products", "users", "stores",
                     "merchant_subscriptions", "merchants", "subscription_plans"
      CASCADE;
    `);
    await runSeed(dataSource);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  it('Stock = 5, POS A sells 3, POS B sells 3: exactly ONE succeeds and stock is safely reduced to 2 (no overselling)', async () => {
    // Verify initial stock is exactly 5
    const [initial] = await dataSource.query(
      `SELECT "quantity" FROM "store_inventory" WHERE "storeId" = $1 AND "productId" = $2`,
      [storeId, productId],
    );
    expect(initial.quantity).toBe(5);

    // Fire both POS sale requests concurrently at the exact same moment
    const [resultA, resultB] = await Promise.allSettled([
      salesService.createSale(
        { items: [{ productId, quantity: 3 }] },
        cashierPayloadA,
        storeId,
      ),
      salesService.createSale(
        { items: [{ productId, quantity: 3 }] },
        cashierPayloadB,
        storeId,
      ),
    ]);

    const fulfilled = [resultA, resultB].filter((r) => r.status === 'fulfilled');
    const rejected = [resultA, resultB].filter((r) => r.status === 'rejected');

    // Exactly one must succeed
    expect(fulfilled).toHaveLength(1);
    // Exactly one must be rejected due to insufficient inventory
    expect(rejected).toHaveLength(1);

    const rejectedReason: any = (rejected[0] as PromiseRejectedResult).reason;
    expect(rejectedReason.message).toContain('Insufficient inventory');

    // Inspect the remaining stock in PostgreSQL: 5 - 3 = 2 (NOT negative, NOT -1)
    const [finalInv] = await dataSource.query(
      `SELECT "quantity" FROM "store_inventory" WHERE "storeId" = $1 AND "productId" = $2`,
      [storeId, productId],
    );
    expect(finalInv.quantity).toBe(2);

    // Verify only 1 sale row exists for Store 1
    const sales = await dataSource.query(
      `SELECT * FROM "sales" WHERE "storeId" = $1 AND "status" = 'PAID'`,
      [storeId],
    );
    expect(sales).toHaveLength(1);
  });
});
