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
    // 1. Seed Merchants
    for (const m of [SEED_CONSTANTS.MERCHANT_A, SEED_CONSTANTS.MERCHANT_B]) {
      await queryRunner.query(
        `INSERT INTO "merchants" ("id", "name", "slug", "isActive")
         VALUES ($1, $2, $3, true)
         ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name";`,
        [m.id, m.name, m.slug],
      );
    }
    console.log('✅ Merchants seeded');

    // 2. Seed Stores
    for (const s of [SEED_CONSTANTS.STORE_1, SEED_CONSTANTS.STORE_2, SEED_CONSTANTS.STORE_3]) {
      await queryRunner.query(
        `INSERT INTO "stores" ("id", "merchantId", "name", "address", "isActive")
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "address" = EXCLUDED."address";`,
        [s.id, s.merchantId, s.name, s.address],
      );
    }
    console.log('✅ Stores seeded');

    // 3. Seed Users
    for (const u of Object.values(SEED_CONSTANTS.USERS)) {
      await queryRunner.query(
        `INSERT INTO "users" ("id", "merchantId", "storeId", "email", "passwordHash", "role", "isActive")
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT ("email") DO UPDATE SET "role" = EXCLUDED."role", "passwordHash" = EXCLUDED."passwordHash";`,
        [u.id, u.merchantId, u.storeId, u.email, passwordHash, u.role],
      );
    }
    console.log('✅ Users seeded');

    // 4. Seed Products
    for (const p of Object.values(SEED_CONSTANTS.PRODUCTS)) {
      await queryRunner.query(
        `INSERT INTO "products" ("id", "merchantId", "name", "description", "priceMinorUnits", "currency", "sku", "isActive")
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)
         ON CONFLICT ("merchantId", "sku") DO UPDATE SET "name" = EXCLUDED."name", "priceMinorUnits" = EXCLUDED."priceMinorUnits";`,
        [p.id, p.merchantId, p.name, p.description, p.priceMinorUnits, p.currency, p.sku],
      );
    }
    console.log('✅ Products seeded');

    // 5. Seed Inventory
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
    console.log(`Owner A:    ${SEED_CONSTANTS.USERS.OWNER_A.email} (Merchant A)`);
    console.log(`Manager S1: ${SEED_CONSTANTS.USERS.MANAGER_S1.email} (Store 1)`);
    console.log(`Cashier S1: ${SEED_CONSTANTS.USERS.CASHIER_S1.email} (Store 1, Stock=5 for COF-ESP-001)`);
    console.log(`Cashier S3: ${SEED_CONSTANTS.USERS.CASHIER_S3.email} (Store 3 / Merchant B)`);
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
