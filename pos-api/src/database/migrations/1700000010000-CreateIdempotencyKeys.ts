import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIdempotencyKeys1700000010000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "idempotency_keys" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "storeId" uuid NOT NULL,
        "key" character varying(255) NOT NULL,
        "requestHash" character varying(64) NOT NULL,
        "responseStatus" integer,
        "responseBody" jsonb,
        "isProcessing" boolean NOT NULL DEFAULT false,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_idempotency_keys_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_idempotency_keys_store_key" UNIQUE ("storeId", "key"),
        CONSTRAINT "FK_idempotency_keys_storeId" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE
      );

      CREATE INDEX "IDX_idempotency_keys_expiresAt" ON "idempotency_keys" ("expiresAt");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "idempotency_keys";`);
  }
}
