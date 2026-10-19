import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProducts1700000005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "merchantId" uuid NOT NULL,
        "name" character varying(300) NOT NULL,
        "description" text,
        "priceMinorUnits" bigint NOT NULL,
        "currency" character varying(3) NOT NULL DEFAULT 'INR',
        "sku" character varying(100) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_products_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_products_merchantId_sku" UNIQUE ("merchantId", "sku"),
        CONSTRAINT "CHK_products_priceMinorUnits" CHECK ("priceMinorUnits" >= 0),
        CONSTRAINT "FK_products_merchantId" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE
      );

      CREATE INDEX "IDX_products_merchantId" ON "products" ("merchantId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "products";`);
  }
}
