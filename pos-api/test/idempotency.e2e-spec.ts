import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { TestHelper } from './test-helper';
import { SEED_CONSTANTS } from '../src/database/seeds/seed-constants';

describe('Idempotency (E2E) — Mandatory Scenario T-5', () => {
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

  describe('T-5: Duplicate Request Does Not Create a Second Sale', () => {
    it('replays identical response for retried request and prevents double-selling and double-charging', async () => {
      const storeId = SEED_CONSTANTS.STORE_1.id;
      const productId = SEED_CONSTANTS.PRODUCTS.A2.id;
      const idempotencyKey = uuidv4();
      const payload = {
        items: [{ productId, quantity: 2 }],
        paymentMetadata: { simulateFailure: false },
      };

      // ── FIRST ATTEMPT (Simulating original client request) ──────────────────
      const firstResponse = await request(helper.app.getHttpServer())
        .post(`/api/v1/stores/${storeId}/sales`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send(payload);

      expect(firstResponse.status).toBe(201);
      const originalSaleId = firstResponse.body.data.id;
      expect(originalSaleId).toBeDefined();

      // Check inventory after first attempt
      const [invAfterFirst] = await helper.dataSource.query(
        `SELECT "quantity" FROM "store_inventory" WHERE "storeId" = $1 AND "productId" = $2`,
        [storeId, productId],
      );
      const expectedStock = 20 - 2; // initial 20 - 2
      expect(invAfterFirst.quantity).toBe(expectedStock);

      // ── SECOND ATTEMPT (Simulating network retry from POS terminal) ────────
      const secondResponse = await request(helper.app.getHttpServer())
        .post(`/api/v1/stores/${storeId}/sales`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send(payload);

      expect(secondResponse.status).toBe(201);
      expect(secondResponse.headers['x-idempotency-replayed']).toBe('true');
      expect(secondResponse.body.data.id).toBe(originalSaleId);

      // Verify in DB that only 1 sale exists with this ID
      const sales = await helper.dataSource.query(
        `SELECT * FROM "sales" WHERE "id" = $1`,
        [originalSaleId],
      );
      expect(sales).toHaveLength(1);

      // Verify inventory was NOT decremented a second time!
      const [invAfterSecond] = await helper.dataSource.query(
        `SELECT "quantity" FROM "store_inventory" WHERE "storeId" = $1 AND "productId" = $2`,
        [storeId, productId],
      );
      expect(invAfterSecond.quantity).toBe(expectedStock);
    });

    it('rejects reusing an idempotency key with a different payload with 422', async () => {
      const storeId = SEED_CONSTANTS.STORE_1.id;
      const idempotencyKey = uuidv4();

      // Original request
      await request(helper.app.getHttpServer())
        .post(`/api/v1/stores/${storeId}/sales`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          items: [{ productId: SEED_CONSTANTS.PRODUCTS.A3.id, quantity: 1 }],
        });

      // Different payload with SAME key
      const conflictResponse = await request(helper.app.getHttpServer())
        .post(`/api/v1/stores/${storeId}/sales`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          items: [{ productId: SEED_CONSTANTS.PRODUCTS.A3.id, quantity: 5 }], // changed quantity
        });

      expect(conflictResponse.status).toBe(422);
      expect(conflictResponse.body.message).toContain('reused with a different request payload');
    });

    it('rejects POST /sales when Idempotency-Key header is missing with 400 Bad Request', async () => {
      const storeId = SEED_CONSTANTS.STORE_1.id;

      const response = await request(helper.app.getHttpServer())
        .post(`/api/v1/stores/${storeId}/sales`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          items: [{ productId: SEED_CONSTANTS.PRODUCTS.A3.id, quantity: 1 }],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Missing required header: Idempotency-Key');
    });
  });
});
