import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { TestHelper } from './test-helper';
import { SEED_CONSTANTS } from '../src/database/seeds/seed-constants';

describe('Inventory Enforcement (E2E) — Mandatory Scenario T-3', () => {
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

  describe('T-3: Insufficient Inventory', () => {
    it('rejects sale with 422 Unprocessable Entity when requested quantity exceeds available stock', async () => {
      const storeId = SEED_CONSTANTS.STORE_1.id;
      const productId = SEED_CONSTANTS.PRODUCTS.A1.id; // Espresso Roast, price: 45000, initial qty: 5
      const availableStock = 5;
      const excessiveQty = 10; // Requesting 10 when only 5 exist
      const idempotencyKey = uuidv4();

      const response = await request(helper.app.getHttpServer())
        .post(`/api/v1/stores/${storeId}/sales`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          items: [{ productId, quantity: excessiveQty }],
        });

      expect(response.status).toBe(422);
      expect(response.body.statusCode).toBe(422);
      expect(response.body.message).toContain('Insufficient inventory');

      // Verify that no sale was created in the database
      const sales = await helper.dataSource.query(
        `SELECT * FROM "sales" WHERE "storeId" = $1`,
        [storeId],
      );
      expect(sales).toHaveLength(0);

      // Verify stock was NOT altered
      const [inv] = await helper.dataSource.query(
        `SELECT "quantity" FROM "store_inventory" WHERE "storeId" = $1 AND "productId" = $2`,
        [storeId, productId],
      );
      expect(inv.quantity).toBe(availableStock);
    });
  });
});
