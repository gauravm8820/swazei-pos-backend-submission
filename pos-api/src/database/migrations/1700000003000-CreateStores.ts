import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStores1700000003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "stores" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "merchantId" uuid NOT NULL,
        "name" character varying(200) NOT NULL,
        "address" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stores_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_stores_merchantId" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE
      );
      CREATE INDEX "IDX_stores_merchantId" ON "stores" ("merchantId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "stores";`);
  }
}
