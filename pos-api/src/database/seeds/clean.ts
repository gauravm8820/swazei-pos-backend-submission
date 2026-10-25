import { AppDataSource } from '../data-source';

export async function cleanDatabase() {
  const ds = await AppDataSource.initialize();
  console.log('🧹 Wiping all application data...');

  await ds.query(`
    TRUNCATE TABLE "idempotency_keys", "payments", "sale_items", "sales",
                   "store_inventory", "products", "users", "stores",
                   "merchant_subscriptions", "merchants"
    CASCADE;
  `);

  console.log('✨ Database clean! Ready for manual end-to-end testing.');
  await ds.destroy();
}

if (require.main === module) {
  cleanDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
