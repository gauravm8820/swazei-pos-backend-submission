import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePayments1700000009000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."payments_status_enum" AS ENUM('PENDING', 'SUCCESS', 'FAILED');

      CREATE TABLE "payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "saleId" uuid NOT NULL,
        "status" "public"."payments_status_enum" NOT NULL DEFAULT 'PENDING',
        "provider" character varying(50) NOT NULL DEFAULT 'mock',
        "providerReference" character varying(255),
        "amountMinorUnits" bigint NOT NULL,
        "currency" character varying(3) NOT NULL DEFAULT 'INR',
        "providerResponse" jsonb,
        "failureReason" character varying(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payments_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_payments_saleId" UNIQUE ("saleId"),
        CONSTRAINT "FK_payments_saleId" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE
      );

      CREATE INDEX "IDX_payments_saleId" ON "payments" ("saleId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "payments";`);
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum";`);
  }
}
