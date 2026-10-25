import { TestHelper } from './test-helper';
import * as request from 'supertest';
import { SEED_CONSTANTS } from '../src/database/seeds/seed-constants';

describe('SaaS Platform Super Admin & Subscription Lifecycle (E2E)', () => {
  const helper = new TestHelper();
  let superAdminToken: string;
  let clientOwnerToken: string;

  beforeAll(async () => {
    await helper.init();
    await helper.resetDatabase();
    superAdminToken = await helper.getAuthToken(SEED_CONSTANTS.USERS.SUPER_ADMIN.email);
  });

  afterAll(async () => {
    await helper.close();
  });

  describe('Super Admin Operations', () => {
    it('1. Super Admin logs in and retrieves all subscription plans', async () => {
      const res = await request(helper.app.getHttpServer())
        .get('/api/v1/subscriptions/plans')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
      expect(res.body.data.some((p: any) => p.slug === 'starter')).toBe(true);
    });

    it('2. Super Admin creates a new custom enterprise plan', async () => {
      const res = await request(helper.app.getHttpServer())
        .post('/api/v1/subscriptions/plans')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Micro Kiosk Plan',
          slug: 'micro-kiosk',
          description: 'Special 1-store 1-cashier plan for kiosks',
          priceMinorUnits: 29900,
          currency: 'INR',
          durationMonths: 1,
          maxStores: 1,
          maxUsers: 1,
          features: ['Single Terminal', 'Receipt Printing'],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Micro Kiosk Plan');
      expect(res.body.data.maxStores).toBe(1);
      expect(res.body.data.maxUsers).toBe(1);
    });

    it('3. Super Admin onboards a new client company with owner and subscription plan', async () => {
      const res = await request(helper.app.getHttpServer())
        .post('/api/v1/merchants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          companyName: 'Gamma Retail Group',
          slug: 'gamma-retail',
          planSlug: 'micro-kiosk',
          ownerEmail: 'owner-gamma@retail.com',
          ownerPassword: 'password123',
          notes: 'Special promo tier',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.merchant.name).toBe('Gamma Retail Group');
      expect(res.body.data.owner.email).toBe('owner-gamma@retail.com');
      expect(res.body.data.subscription.status).toBe('ACTIVE');
    });

    it('4. Super Admin lists all onboarded merchants', async () => {
      const res = await request(helper.app.getHttpServer())
        .get('/api/v1/merchants')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((m: any) => m.slug === 'gamma-retail')).toBe(true);
    });
  });

  describe('Client Self-Management & Subscription Limits Enforcement', () => {
    it('5. Newly onboarded client owner logs in and views subscription profile', async () => {
      clientOwnerToken = await helper.getAuthToken('owner-gamma@retail.com');
      expect(clientOwnerToken).toBeDefined();

      const res = await request(helper.app.getHttpServer())
        .get('/api/v1/merchants/me')
        .set('Authorization', `Bearer ${clientOwnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Gamma Retail Group');
      expect(res.body.data.subscription).toBeDefined();
      expect(res.body.data.subscription.plan.slug).toBe('micro-kiosk');
      expect(res.body.data.subscription.remainingDays).toBeGreaterThan(0);
      expect(res.body.data.subscription.plan.maxStores).toBe(1);
      expect(res.body.data.subscription.plan.maxUsers).toBe(1);
    });

    it('6. Client owner creates 1 store successfully (within plan limit)', async () => {
      const res = await request(helper.app.getHttpServer())
        .post('/api/v1/stores')
        .set('Authorization', `Bearer ${clientOwnerToken}`)
        .send({
          name: 'Gamma Kiosk #1',
          address: 'Mall of India, Ground Floor',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Gamma Kiosk #1');
    });

    it('7. Client owner attempts to create a 2nd store and is BLOCKED by subscription limit (maxStores = 1)', async () => {
      const res = await request(helper.app.getHttpServer())
        .post('/api/v1/stores')
        .set('Authorization', `Bearer ${clientOwnerToken}`)
        .send({
          name: 'Gamma Kiosk #2',
          address: 'Terminal 1, Departure',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/limit reached/i);
    });

    it('8. Super Admin upgrades the client subscription to Growth plan', async () => {
      // Find Gamma merchant ID
      const merchantsRes = await request(helper.app.getHttpServer())
        .get('/api/v1/merchants')
        .set('Authorization', `Bearer ${superAdminToken}`);

      const gamma = merchantsRes.body.data.find((m: any) => m.slug === 'gamma-retail');
      expect(gamma).toBeDefined();

      const upgradeRes = await request(helper.app.getHttpServer())
        .post('/api/v1/subscriptions/assign')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          merchantId: gamma.id,
          planSlug: 'growth',
        });

      expect(upgradeRes.status).toBe(201);
      expect(upgradeRes.body.data.plan.slug).toBe('growth');
    });

    it('9. Client owner can now create the 2nd store after plan upgrade', async () => {
      const res = await request(helper.app.getHttpServer())
        .post('/api/v1/stores')
        .set('Authorization', `Bearer ${clientOwnerToken}`)
        .send({
          name: 'Gamma Kiosk #2',
          address: 'Terminal 1, Departure',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Gamma Kiosk #2');
    });
  });
});
