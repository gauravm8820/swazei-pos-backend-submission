import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSuperAdminAndSubscriptions1700000011000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add SUPER_ADMIN to users_role_enum
    await queryRunner.query(`
      ALTER TYPE "public"."users_role_enum" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
    `);

    // 2. Make users.merchantId nullable for global platform super admins
    await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "merchantId" DROP NOT NULL;
    `);

    // 3. Create subscription status enum
    await queryRunner.query(`
      CREATE TYPE "public"."subscription_status_enum" AS ENUM('ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED');
    `);

    // 4. Create subscription_plans table (Master Catalog)
    await queryRunner.query(`
      CREATE TABLE "subscription_plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "slug" character varying(100) NOT NULL,
        "description" text,
        "priceMinorUnits" bigint NOT NULL DEFAULT 0,
        "currency" character varying(3) NOT NULL DEFAULT 'INR',
        "durationMonths" integer NOT NULL DEFAULT 1,
        "maxStores" integer NOT NULL DEFAULT 1,
        "maxUsers" integer NOT NULL DEFAULT 5,
        "features" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscription_plans_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_subscription_plans_slug" UNIQUE ("slug"),
        CONSTRAINT "CHK_subscription_plans_price" CHECK ("priceMinorUnits" >= 0),
        CONSTRAINT "CHK_subscription_plans_duration" CHECK ("durationMonths" > 0),
        CONSTRAINT "CHK_subscription_plans_maxStores" CHECK ("maxStores" > 0),
        CONSTRAINT "CHK_subscription_plans_maxUsers" CHECK ("maxUsers" > 0)
      );

      CREATE INDEX "IDX_subscription_plans_slug" ON "subscription_plans" ("slug");
      CREATE INDEX "IDX_subscription_plans_isActive" ON "subscription_plans" ("isActive");
    `);

    // 5. Create merchant_subscriptions table (Links Merchant to Plan)
    await queryRunner.query(`
      CREATE TABLE "merchant_subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "merchantId" uuid NOT NULL,
        "planId" uuid NOT NULL,
        "status" "public"."subscription_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "startDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "autoRenew" boolean NOT NULL DEFAULT false,
        "notes" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_merchant_subscriptions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_merchant_subscriptions_merchantId" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_merchant_subscriptions_planId" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT
      );

      CREATE INDEX "IDX_merchant_subscriptions_merchantId" ON "merchant_subscriptions" ("merchantId");
      CREATE INDEX "IDX_merchant_subscriptions_status" ON "merchant_subscriptions" ("status");
      CREATE INDEX "IDX_merchant_subscriptions_endDate" ON "merchant_subscriptions" ("endDate");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "merchant_subscriptions";`);
    await queryRunner.query(`DROP TABLE "subscription_plans";`);
    await queryRunner.query(`DROP TYPE "public"."subscription_status_enum";`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "merchantId" SET NOT NULL;`);
  }
}
