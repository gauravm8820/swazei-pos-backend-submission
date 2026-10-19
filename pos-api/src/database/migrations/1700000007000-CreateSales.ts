import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSales1700000007000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."sales_status_enum" AS ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED');

      CREATE TABLE "sales" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "storeId" uuid NOT NULL,
        "cashierId" uuid NOT NULL,
        "status" "public"."sales_status_enum" NOT NULL DEFAULT 'PENDING',
        "totalMinorUnits" bigint NOT NULL,
        "currency" character varying(3) NOT NULL DEFAULT 'INR',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sales_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_sales_totalMinorUnits" CHECK ("totalMinorUnits" >= 0),
        CONSTRAINT "FK_sales_storeId" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_sales_cashierId" FOREIGN KEY ("cashierId") REFERENCES "users"("id") ON DELETE RESTRICT
      );

      CREATE INDEX "IDX_sales_storeId" ON "sales" ("storeId");
      CREATE INDEX "IDX_sales_status" ON "sales" ("status");
      CREATE INDEX "IDX_sales_createdAt" ON "sales" ("createdAt");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "sales";`);
    await queryRunner.query(`DROP TYPE "public"."sales_status_enum";`);
  }
}
