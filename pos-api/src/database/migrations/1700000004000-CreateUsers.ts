import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1700000004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."users_role_enum" AS ENUM('OWNER', 'ADMIN', 'MANAGER', 'CASHIER');

      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "merchantId" uuid NOT NULL,
        "storeId" uuid,
        "email" character varying(254) NOT NULL,
        "passwordHash" character varying(255) NOT NULL,
        "role" "public"."users_role_enum" NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_users_merchantId" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_users_storeId" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL
      );

      CREATE INDEX "IDX_users_merchantId" ON "users" ("merchantId");
      CREATE INDEX "IDX_users_storeId" ON "users" ("storeId");
      CREATE INDEX "IDX_users_email" ON "users" ("email");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users";`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum";`);
  }
}
