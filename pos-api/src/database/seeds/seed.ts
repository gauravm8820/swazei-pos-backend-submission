import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { SEED_CONSTANTS } from './seed-constants';

export async function runSeed(dataSource: DataSource) {
  console.log('🌱 Starting database seed...');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  const passwordHash = await bcrypt.hash(SEED_CONSTANTS.DEFAULT_PASSWORD, 10);

  try {
    // 1. Seed Subscription Plans
    for (const plan of Object.values(SEED_CONSTANTS.PLANS)) {
      await queryRunner.query(
        `INSERT INTO "subscription_plans" ("id", "name", "slug", "description", "priceMinorUnits", "currency", "durationMonths", "maxStores", "maxUsers", "features", "isActive")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
         ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name", "priceMinorUnits" = EXCLUDED."priceMinorUnits", "durationMonths" = EXCLUDED."durationMonths", "maxStores" = EXCLUDED."maxStores", "maxUsers" = EXCLUDED."maxUsers", "features" = EXCLUDED."features";`,
        [plan.id, plan.name, plan.slug, plan.description, plan.priceMinorUnits, plan.currency, plan.durationMonths, plan.maxStores, plan.maxUsers, JSON.stringify(plan.features)],
      );
    }
    console.log('✅ Subscription plans seeded');

    // 2. Seed Merchants
    for (const m of [SEED_CONSTANTS.MERCHANT_A, SEED_CONSTANTS.MERCHANT_B]) {
      await queryRunner.query(
        `INSERT INTO "merchants" ("id", "name", "slug", "isActive")
         VALUES ($1, $2, $3, true)
         ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name";`,
        [m.id, m.name, m.slug],
      );
    }
    console.log('✅ Merchants seeded');

    // 3. Seed Merchant Subscriptions
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    // Merchant A -> GROWTH plan
    await queryRunner.query(
      `INSERT INTO "merchant_subscriptions" ("id", "merchantId", "planId", "status", "startDate", "endDate", "autoRenew", "notes")
       VALUES ($1, $2, $3, 'ACTIVE', now(), $4, true, 'Seeded subscription for Alpha')
       ON CONFLICT ("id") DO NOTHING;`,
      ['44444444-4444-4000-8000-000000000001', SEED_CONSTANTS.MERCHANT_A.id, SEED_CONSTANTS.PLANS.GROWTH.id, oneYearFromNow],
    );

    // Merchant B -> STARTER plan
    await queryRunner.query(
      `INSERT INTO "merchant_subscriptions" ("id", "merchantId", "planId", "status", "startDate", "endDate", "autoRenew", "notes")
       VALUES ($1, $2, $3, 'ACTIVE', now(), $4, true, 'Seeded subscription for Beta')
       ON CONFLICT ("id") DO NOTHING;`,
      ['44444444-4444-4000-8000-000000000002', SEED_CONSTANTS.MERCHANT_B.id, SEED_CONSTANTS.PLANS.STARTER.id, oneYearFromNow],
    );
    console.log('✅ Merchant subscriptions seeded');

    // 4. Seed Stores
    for (const s of [SEED_CONSTANTS.STORE_1, SEED_CONSTANTS.STORE_2, SEED_CONSTANTS.STORE_3]) {
      await queryRunner.query(
        `INSERT INTO "stores" ("id", "merchantId", "name", "address", "isActive")
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "address" = EXCLUDED."address";`,
        [s.id, s.merchantId, s.name, s.address],
      );
    }
    console.log('✅ Stores seeded');

    // 5. Seed Users
    for (const u of Object.values(SEED_CONSTANTS.USERS)) {
      await queryRunner.query(
        `INSERT INTO "users" ("id", "merchantId", "storeId", "email", "passwordHash", "role", "isActive")
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT ("email") DO UPDATE SET "role" = EXCLUDED."role", "passwordHash" = EXCLUDED."passwordHash", "merchantId" = EXCLUDED."merchantId";`,
        [u.id, u.merchantId, u.storeId, u.email, passwordHash, u.role],
      );
    }
    console.log('✅ Users seeded');

    // 6. Seed Products
    for (const p of Object.values(SEED_CONSTANTS.PRODUCTS)) {
      await queryRunner.query(
        `INSERT INTO "products" ("id", "merchantId", "name", "description", "priceMinorUnits", "currency", "sku", "isActive")
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)
         ON CONFLICT ("merchantId", "sku") DO UPDATE SET "name" = EXCLUDED."name", "priceMinorUnits" = EXCLUDED."priceMinorUnits";`,
        [p.id, p.merchantId, p.name, p.description, p.priceMinorUnits, p.currency, p.sku],
      );
    }
    console.log('✅ Products seeded');

    // 7. Seed Inventory
    for (const inv of SEED_CONSTANTS.INVENTORY) {
      await queryRunner.query(
        `INSERT INTO "store_inventory" ("storeId", "productId", "quantity")
         VALUES ($1, $2, $3)
         ON CONFLICT ("storeId", "productId") DO UPDATE SET "quantity" = EXCLUDED."quantity";`,
        [inv.storeId, inv.productId, inv.quantity],
      );
    }
    console.log('✅ Store inventory seeded');

    console.log('🎉 Seed completed successfully!');
    console.log('\n--- Seed Sample Accounts ---');
    console.log(`Default Password: ${SEED_CONSTANTS.DEFAULT_PASSWORD}`);
    console.log(`Super Admin: ${SEED_CONSTANTS.USERS.SUPER_ADMIN.email} (Platform Vendor)`);
    console.log(`Owner A:     ${SEED_CONSTANTS.USERS.OWNER_A.email} (Merchant Alpha - Growth Plan)`);
    console.log(`Manager S1:  ${SEED_CONSTANTS.USERS.MANAGER_S1.email} (Store 1)`);
    console.log(`Cashier S1:  ${SEED_CONSTANTS.USERS.CASHIER_S1.email} (Store 1, Stock=5 for COF-ESP-001)`);
    console.log(`Cashier S3:  ${SEED_CONSTANTS.USERS.CASHIER_S3.email} (Store 3 / Merchant Beta - Starter Plan)`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

if (require.main === module) {
  AppDataSource.initialize()
    .then(async (ds) => {
      await runSeed(ds);
      await ds.destroy();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error during seed execution:', err);
      process.exit(1);
    });
}
