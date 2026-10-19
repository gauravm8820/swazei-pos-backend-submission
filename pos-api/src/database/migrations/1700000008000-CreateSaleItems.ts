import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSaleItems1700000008000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sale_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "saleId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "quantity" integer NOT NULL,
        "unitPriceSnapshot" bigint NOT NULL,
        "subtotalMinorUnits" bigint NOT NULL,
        CONSTRAINT "PK_sale_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_sale_items_quantity" CHECK ("quantity" >= 1),
        CONSTRAINT "CHK_sale_items_subtotal" CHECK ("subtotalMinorUnits" >= 0),
        CONSTRAINT "FK_sale_items_saleId" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_sale_items_productId" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT
      );

      CREATE INDEX "IDX_sale_items_saleId" ON "sale_items" ("saleId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "sale_items";`);
  }
}
