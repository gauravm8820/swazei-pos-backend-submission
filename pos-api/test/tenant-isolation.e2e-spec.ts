import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { TestHelper } from './test-helper';
import { SEED_CONSTANTS } from '../src/database/seeds/seed-constants';

describe('Tenant and Store Data Isolation (E2E) — Mandatory Scenario T-4', () => {
  const helper = new TestHelper();
  let cashierA1Token: string;
  let cashierB3Token: string;

  beforeAll(async () => {
    await helper.init();
    await helper.resetDatabase();
    cashierA1Token = await helper.getAuthToken(SEED_CONSTANTS.USERS.CASHIER_S1.email);
    cashierB3Token = await helper.getAuthToken(SEED_CONSTANTS.USERS.CASHIER_S3.email);
  });

  afterAll(async () => {
    await helper.close();
  });

  describe('T-4: Cross-Tenant Access Rejection', () => {
    it('T-4a: Merchant A user cannot access or view Merchant B product by ID (returns 404 Not Found to prevent data existence leakage)', async () => {
      // Product B1 belongs to Merchant B
      const merchantBProductId = SEED_CONSTANTS.PRODUCTS.B1.id;

      const response = await request(helper.app.getHttpServer())
        .get(`/api/v1/products/${merchantBProductId}`)
        .set('Authorization', `Bearer ${cashierA1Token}`);

      // Tenant-scoped repository query yields null -> 404
      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Product not found');
    });

    it('T-4b: Merchant A cashier cannot list or see products of Merchant B', async () => {
      const response = await request(helper.app.getHttpServer())
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${cashierA1Token}`);

      expect(response.status).toBe(200);
      const products = response.body.data;
      // All returned products must strictly belong to Merchant A
      for (const p of products) {
        expect(p.merchantId).toBe(SEED_CONSTANTS.MERCHANT_A.id);
        expect(p.merchantId).not.toBe(SEED_CONSTANTS.MERCHANT_B.id);
      }
    });

    it('T-4c: Merchant A cashier cannot create a sale in Merchant B store (returns 403 Forbidden)', async () => {
      // Store 3 belongs to Merchant B
      const store3Id = SEED_CONSTANTS.STORE_3.id;
      const productA1Id = SEED_CONSTANTS.PRODUCTS.A1.id;

      const response = await request(helper.app.getHttpServer())
        .post(`/api/v1/stores/${store3Id}/sales`)
        .set('Authorization', `Bearer ${cashierA1Token}`)
        .set('Idempotency-Key', uuidv4())
        .send({
          items: [{ productId: productA1Id, quantity: 1 }],
        });

      // StoreAccessGuard blocks cross-merchant access with 403 Forbidden
      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Access denied to this store');
    });

    it('T-4d: Changing an ID in request cannot access another store inventory (returns 403 Forbidden)', async () => {
      const store3Id = SEED_CONSTANTS.STORE_3.id;

      const response = await request(helper.app.getHttpServer())
        .get(`/api/v1/stores/${store3Id}/inventory`)
        .set('Authorization', `Bearer ${cashierA1Token}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Access denied to this store');
    });

    it('T-4e: Cashier from Store 1 cannot access Store 2 within same merchant (store-level isolation)', async () => {
      const store2Id = SEED_CONSTANTS.STORE_2.id; // Store 2 is Merchant A, but cashier is assigned to Store 1

      const response = await request(helper.app.getHttpServer())
        .get(`/api/v1/stores/${store2Id}/inventory`)
        .set('Authorization', `Bearer ${cashierA1Token}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Access denied to this store');
    });
  });
});
