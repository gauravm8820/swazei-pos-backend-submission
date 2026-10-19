import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStoreInventory1700000006000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "store_inventory" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "storeId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "quantity" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_store_inventory_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_store_inventory_store_product" UNIQUE ("storeId", "productId"),
        CONSTRAINT "CHK_store_inventory_quantity" CHECK ("quantity" >= 0),
        CONSTRAINT "FK_store_inventory_storeId" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_store_inventory_productId" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE
      );

      CREATE INDEX "IDX_store_inventory_storeId_productId" ON "store_inventory" ("storeId", "productId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "store_inventory";`);
  }
}
