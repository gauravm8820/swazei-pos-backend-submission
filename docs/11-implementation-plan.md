# 11 — Implementation Plan

## Milestones Overview

| Milestone | Est. Time | Cumulative |
|---|---|---|
| M0: Project scaffold + config | 1h | 1h |
| M1: DB migrations + seed | 1.5h | 2.5h |
| M2: Auth module | 1h | 3.5h |
| M3: Merchants + Stores + Users | 1.5h | 5h |
| M4: Products + Inventory (with Redis) | 1.5h | 6.5h |
| M5: Sales core flow | 3h | 9.5h |
| M6: Idempotency interceptor | 1h | 10.5h |
| M7: Jest tests (mandatory 4 + bonus) | 2h | 12.5h |
| M8: README + Postman + polish | 1.5h | 14h |
| **Buffer** | 2h | **16h** |

---

## M0 — Project Scaffold + Config (1h)

**Git commit**: `feat: scaffold NestJS project with config, docker, and global setup`

### Tasks
- [ ] `cd pos-api && npx @nestjs/cli new pos-api --package-manager npm --skip-git`
- [ ] Install all dependencies upfront (list below)
- [ ] Configure `ConfigModule` with Joi schema validation
- [ ] Create `.env.example` with all required vars
- [ ] `docker-compose.yml` with PostgreSQL 16 + Redis 7
- [ ] Global pipes, filters, interceptors registration in `main.ts`
- [ ] Swagger setup at `/api/docs`
- [ ] Health endpoint (`GET /api/v1/health`)

### NPM Dependencies
```
@nestjs/config @nestjs/jwt @nestjs/passport @nestjs/swagger
@nestjs/cache-manager cache-manager cache-manager-ioredis ioredis
typeorm @nestjs/typeorm pg
passport passport-jwt passport-local
bcrypt
class-validator class-transformer
uuid
joi
```
```
# Dev
@types/bcrypt @types/passport-jwt @types/uuid
jest @nestjs/testing supertest @types/supertest
```

### `.env.example`
```
# App
NODE_ENV=development
PORT=3000

# PostgreSQL
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=pos_db
DATABASE_TEST_NAME=pos_test

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=change_me_to_a_long_random_secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=change_me_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Payment (Mock)
MOCK_PAYMENT_DELAY_MS=50
MOCK_PAYMENT_FAIL_RATE=0
```

---

## M1 — DB Migrations + Seed (1.5h)

**Git commit**: `feat: add database migrations and seed data`

### Migration Files (in order)
1. `{ts}-EnableUuidExtension.ts`
2. `{ts}-CreateMerchants.ts`
3. `{ts}-CreateStores.ts`
4. `{ts}-CreateUsers.ts`
5. `{ts}-CreateProducts.ts`
6. `{ts}-CreateStoreInventory.ts`
7. `{ts}-CreateSales.ts`
8. `{ts}-CreateSaleItems.ts`
9. `{ts}-CreatePayments.ts`
10. `{ts}-CreateIdempotencyKeys.ts`

### Seed File — Known UUIDs for Tests
```
MERCHANT_A_ID  = '11111111-0000-0000-0000-000000000001'
MERCHANT_B_ID  = '22222222-0000-0000-0000-000000000001'
STORE_1_ID     = '11111111-1111-0000-0000-000000000001' (merchant A)
STORE_2_ID     = '11111111-2222-0000-0000-000000000001' (merchant A)
STORE_3_ID     = '22222222-3333-0000-0000-000000000001' (merchant B)
OWNER_A_ID     = '11111111-0000-0000-0000-000000000002'
OWNER_B_ID     = '22222222-0000-0000-0000-000000000002'
MANAGER_S1_ID  = '11111111-1111-0000-0000-000000000003'
CASHIER_S1_ID  = '11111111-1111-0000-0000-000000000004'
CASHIER_S3_ID  = '22222222-3333-0000-0000-000000000004' (merchant B)
PRODUCT_A1_ID  = '11111111-aaaa-0000-0000-000000000001'
PRODUCT_A2_ID  = '11111111-aaaa-0000-0000-000000000002'
PRODUCT_A3_ID  = '11111111-aaaa-0000-0000-000000000003'
```

---

## M2 — Auth Module (1h)

**Git commit**: `feat: implement JWT authentication with login and refresh`

### Tasks
- [ ] `JwtStrategy` (passport-jwt, signs `{ sub, merchantId, storeId, role }`)
- [ ] `LocalStrategy` (passport-local, validates email + bcrypt password)
- [ ] `AuthController` — POST `/auth/login`, POST `/auth/refresh`, GET `/auth/me`
- [ ] `AuthService.login()` — returns `{ accessToken, refreshToken, user }`
- [ ] `JwtAuthGuard` (global default, with `@Public()` decorator bypass)
- [ ] `RolesGuard` (global, reads `@Roles()` metadata)

---

## M3 — Merchants, Stores, Users Modules (1.5h)

**Git commit**: `feat: implement merchants, stores, and users CRUD with RBAC`

### Tasks
- [ ] Entities: `Merchant`, `Store`, `User` with TypeORM decorators
- [ ] Repositories: each with tenant-scoped `findOne`, `findAll`
- [ ] `StoreAccessGuard` — validates `:storeId` belongs to caller's `merchantId`
- [ ] Controllers + Services + DTOs for all endpoints in `09-api-design.md`
- [ ] Soft delete on `User`

---

## M4 — Products + Inventory with Redis Cache (1.5h)

**Git commit**: `feat: add products and inventory modules with Redis caching`

### Tasks
- [ ] `RedisModule` — global `CacheModule` with ioredis adapter
- [ ] `ProductsService` — CRUD, cache on GET, invalidate on mutation
- [ ] `InventoryService` — stock read (cached), stock update (write-through invalidation)
- [ ] `CacheService` (thin wrapper around `CACHE_MANAGER`) with typed get/set/del helpers
- [ ] `PUT /stores/:storeId/inventory/:productId` — idempotent set (upsert)

---

## M5 — Sales Core Flow (3h)

**Git commit**: `feat: implement sale creation with atomic transaction and payment flow`

This is the biggest and most critical milestone.

### Tasks
- [ ] `Sale`, `SaleItem`, `Payment` entities
- [ ] `PaymentPort` interface + `PAYMENT_PORT` DI token
- [ ] `MockPaymentProvider` with `simulateFailure` metadata support
- [ ] `PaymentsModule`
- [ ] `SalesService.createSale()`:
  - [ ] Validate all products exist and are active (merchant-scoped)
  - [ ] Sort product IDs (deadlock prevention)
  - [ ] Open DB transaction with `SELECT ... FOR UPDATE` on inventory rows
  - [ ] Validate stock sufficiency for each item
  - [ ] Calculate server-side total
  - [ ] Insert `Sale` (status=PENDING) + all `SaleItem` rows
  - [ ] Decrement inventory
  - [ ] Commit transaction
  - [ ] Call `paymentPort.charge()` outside transaction
  - [ ] Payment SUCCESS → UPDATE sale + INSERT payment (status=SUCCESS)
  - [ ] Payment FAILED → compensation TX (restore inventory, status=FAILED, INSERT payment)
- [ ] `SalesController` + `SalesRepository`
- [ ] `GET /sales` (list) + `GET /sales/:id` (detail with items + payment)

---

## M6 — Idempotency Interceptor (1h)

**Git commit**: `feat: add idempotency interceptor for POST /sales`

### Tasks
- [ ] `IdempotencyKey` entity + repository
- [ ] `IdempotencyService` — insert, lookup, update, hash comparison
- [ ] `IdempotencyInterceptor`:
  - [ ] Extract `Idempotency-Key` header (400 if missing on protected route)
  - [ ] Compute `request_hash`
  - [ ] Lookup existing key → replay / 409 / 422 paths
  - [ ] Set `is_processing=true` on new request
  - [ ] Post-handler: store response body + status, set `is_processing=false`
- [ ] Apply interceptor via `@UseInterceptors(IdempotencyInterceptor)` on `POST /sales`
- [ ] Expiry cleanup cron job (`@Cron('0 2 * * *')`)

---

## M7 — Jest Tests (2h)

**Git commit**: `test: add all mandatory jest tests plus bonus concurrency test`

### Tasks (in order of implementation)
- [ ] `test/setup.ts` — test app bootstrap + DB connection
- [ ] `test/fixtures/seed.ts` — programmatic test seed using known UUIDs
- [ ] `test/sale.e2e-spec.ts` — T-1 (success) + T-2 (payment failed)
- [ ] `test/inventory.e2e-spec.ts` — T-3 (insufficient stock)
- [ ] `test/tenant-isolation.e2e-spec.ts` — T-4 (cross-tenant 403/404)
- [ ] `test/idempotency.e2e-spec.ts` — T-5 (no second sale on retry)
- [ ] `src/modules/sales/sales.service.concurrent.spec.ts` — BONUS
- [ ] `src/modules/sales/sales.service.spec.ts` — unit tests (mocked repos)
- [ ] `npm test` passes green

---

## M8 — README + Postman + Polish (1.5h)

**Git commit**: `docs: complete README, Postman collection, and final polish`

### Tasks
- [ ] `pos-api/README.md` covering all required sections from PDF
- [ ] Export Postman collection from Swagger OpenAPI JSON
- [ ] Verify `.env.example` is complete and no secrets in repo
- [ ] `npm run build` passes without errors
- [ ] `npm run lint` passes
- [ ] Final review: all endpoints work with seed data
- [ ] Update `docs/00-requirements-checklist.md` — all items ✅

---

## Git Commit Strategy

| Commit | Message |
|---|---|
| Initial | `chore: initial project scaffold and docker setup` |
| After M0 | `feat: scaffold NestJS project with config, docker, and global setup` |
| After M1 | `feat: add database migrations and seed data` |
| After M2 | `feat: implement JWT authentication with login and refresh` |
| After M3 | `feat: implement merchants, stores, and users CRUD with RBAC` |
| After M4 | `feat: add products and inventory modules with Redis caching` |
| After M5 | `feat: implement sale creation with atomic transaction and payment flow` |
| After M6 | `feat: add idempotency interceptor for POST /sales` |
| After M7 | `test: add all mandatory jest tests plus bonus concurrency test` |
| After M8 | `docs: complete README, Postman collection, and final polish` |
| Fixes | `fix: <specific thing>` |
| Refactors | `refactor: <specific thing>` |

---

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| TypeORM transaction API complexity | Use `DataSource.transaction(async (em) => { ... })` wrapper — straightforward pattern |
| Redis cache-manager v5 breaking changes | Use `@nestjs/cache-manager` v2 which wraps cache-manager v5 with NestJS DI |
| E2E test flakiness (timing) | Use deterministic `simulateFailure` flag; no real async timers in tests |
| TypeORM migration drift | Never edit committed migrations; always generate new ones |
| Time overrun on M5 | M5 is the core; if tight, defer GET /sales list pagination to buffer time |

---

## Assumptions

1. **Currency**: Default currency is `INR`. All prices are in Indian Rupee minor units (paise). 100 paise = ₹1.
2. **No refresh token rotation**: Refresh tokens are stateless JWTs; rotation/revocation is a future concern.
3. **OWNER role setup**: OWNER users are created via the seed script. There is no self-registration endpoint.
4. **Payment provider**: The mock provider is always used. Real provider integration is a documented future path.
5. **Single currency per merchant**: All products in a merchant's catalog use the same currency (no mixed-currency sales).
6. **No partial sale refunds**: Refund is a future feature; only full sale status change is in scope.
7. **Postman collection**: Generated from OpenAPI spec (Swagger), not hand-crafted. Equivalent quality.
