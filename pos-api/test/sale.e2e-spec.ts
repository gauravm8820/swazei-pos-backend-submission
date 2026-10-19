import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { TestHelper } from './test-helper';
import { SEED_CONSTANTS } from '../src/database/seeds/seed-constants';

describe('Sales Flow (E2E) — Mandatory Scenarios T-1 and T-2', () => {
  const helper = new TestHelper();
  let cashierToken: string;

  beforeAll(async () => {
    await helper.init();
    await helper.resetDatabase();
    cashierToken = await helper.getAuthToken(SEED_CONSTANTS.USERS.CASHIER_S1.email);
  });

  afterAll(async () => {
    await helper.close();
  });

  describe('T-1: Successful Sale', () => {
    it('creates a sale, marks it PAID, records payment SUCCESS, and decrements inventory', async () => {
      const storeId = SEED_CONSTANTS.STORE_1.id;
      const productId = SEED_CONSTANTS.PRODUCTS.A2.id; // Ceramic Coffee Mug, price: 25000, initial qty: 20
      const initialQty = 20;
      const purchaseQty = 2;
      const idempotencyKey = uuidv4();

      const response = await request(helper.app.getHttpServer())
        .post(`/api/v1/stores/${storeId}/sales`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          items: [{ productId, quantity: purchaseQty }],
          paymentMetadata: { simulateFailure: false },
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toBeDefined();

      const sale = response.body.data;
      expect(sale.status).toBe('PAID');
      expect(sale.storeId).toBe(storeId);
      expect(Number(sale.totalMinorUnits)).toBe(SEED_CONSTANTS.PRODUCTS.A2.priceMinorUnits * purchaseQty);
      expect(sale.items).toHaveLength(1);
      expect(sale.items[0].productId).toBe(productId);
      expect(sale.items[0].quantity).toBe(purchaseQty);
      expect(Number(sale.items[0].unitPriceSnapshot)).toBe(SEED_CONSTANTS.PRODUCTS.A2.priceMinorUnits);

      expect(sale.payment).toBeDefined();
      expect(sale.payment.status).toBe('SUCCESS');
      expect(sale.payment.provider).toBe('mock');

      // Verify inventory was decremented in database
      const [inv] = await helper.dataSource.query(
        `SELECT "quantity" FROM "store_inventory" WHERE "storeId" = $1 AND "productId" = $2`,
        [storeId, productId],
      );
      expect(inv.quantity).toBe(initialQty - purchaseQty);
    });
  });

  describe('T-2: Failed Sale', () => {
    it('marks sale FAILED, records payment FAILED, and compensates (restores) inventory', async () => {
      const storeId = SEED_CONSTANTS.STORE_1.id;
      const productId = SEED_CONSTANTS.PRODUCTS.A3.id; // Almond Croissant, price: 15000, initial qty: 50
      const initialQty = 50;
      const purchaseQty = 3;
      const idempotencyKey = uuidv4();

      const response = await request(helper.app.getHttpServer())
        .post(`/api/v1/stores/${storeId}/sales`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          items: [{ productId, quantity: purchaseQty }],
          paymentMetadata: { simulateFailure: true }, // Simulate payment failure
        });

      expect(response.status).toBe(402); // 402 PAYMENT_REQUIRED
      expect(response.body.error).toBe('PAYMENT_FAILED');

      const failedSale = response.body.data;
      expect(failedSale).toBeDefined();
      expect(failedSale.status).toBe('FAILED');
      expect(failedSale.payment).toBeDefined();
      expect(failedSale.payment.status).toBe('FAILED');

      // Crucial: Verify inventory was compensated back to initialQty (NOT decremented)
      const [inv] = await helper.dataSource.query(
        `SELECT "quantity" FROM "store_inventory" WHERE "storeId" = $1 AND "productId" = $2`,
        [storeId, productId],
      );
      expect(inv.quantity).toBe(initialQty);
    });
  });
});
