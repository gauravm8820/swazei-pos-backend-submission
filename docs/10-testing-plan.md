# 10 — Testing Plan

## 1. Test Philosophy

> Focus on meaningful business scenarios over coverage percentages.

Tests demonstrate that the critical invariants of the system hold:
1. Sales are atomic and financially consistent
2. Inventory cannot go negative
3. Tenants cannot access each other's data
4. POS retries are safe (idempotent)

---

## 2. Test Structure

```
pos-api/
├── src/
│   └── modules/
│       ├── auth/
│       │   └── auth.service.spec.ts          # Unit: login, JWT generation
│       ├── products/
│       │   └── products.service.spec.ts      # Unit: CRUD, cache invalidation
│       ├── inventory/
│       │   └── inventory.service.spec.ts     # Unit: stock update, validation
│       ├── sales/
│       │   ├── sales.service.spec.ts         # Unit: createSale logic (all paths)
│       │   └── sales.service.concurrent.spec.ts  # BONUS: concurrency test
│       └── idempotency/
│           └── idempotency.service.spec.ts   # Unit: key lookup, hash check
│
└── test/
    ├── setup.ts                              # DB + app bootstrap for e2e
    ├── sale.e2e-spec.ts                      # T-1, T-2: successful + failed sale
    ├── inventory.e2e-spec.ts                 # T-3: insufficient inventory
    ├── tenant-isolation.e2e-spec.ts          # T-4: cross-tenant rejection
    └── idempotency.e2e-spec.ts              # T-5: duplicate request
```

---

## 3. Unit vs E2E Split

| Layer | Type | Tools | DB |
|---|---|---|---|
| Service logic | Unit | Jest, `@nestjs/testing`, manual mocks | None (mocked repos) |
| Controller + e2e flows | E2E / Integration | Jest, Supertest, TestContainers or test DB | Real PostgreSQL (test DB) |

### Unit Tests — Mock Strategy
- Repositories mocked with `jest.fn()` — no DB required
- `PaymentPort` mocked to return controlled results
- Redis cache mocked (`jest.mock()`) — not needed for service logic tests
- Focused on: input validation, business rule execution, error throwing

### E2E Tests — Setup
- Use `@nestjs/testing` `createTestingModule` + `app.init()` + Supertest
- Spin up a dedicated test database (`pos_test`) pre-seeded with known data
- `beforeAll`: run migrations + seed
- `afterAll`: drop test DB or truncate tables
- Each test file uses fixed UUIDs from seed data for deterministic assertions

---

## 4. Mandatory Test Scenarios (from PDF)

### T-1: Successful Sale

```typescript
// test/sale.e2e-spec.ts
describe('POST /api/v1/stores/:storeId/sales', () => {
  it('T-1: creates a sale and marks it PAID on payment SUCCESS', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/stores/${SEED.store1Id}/sales`)
      .set('Authorization', `Bearer ${cashierToken}`)
      .set('Idempotency-Key', randomUUID())
      .send({
        items: [{ productId: SEED.product1Id, quantity: 2 }],
        paymentMetadata: {},  // no simulateFailure → SUCCESS
      });

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('PAID');
    expect(response.body.data.payment.status).toBe('SUCCESS');
    expect(response.body.data.totalMinorUnits).toBe(SEED.product1Price * 2);

    // Verify inventory decremented
    const inv = await inventoryRepo.findOne({ storeId: SEED.store1Id, productId: SEED.product1Id });
    expect(inv.quantity).toBe(SEED.product1InitialQty - 2);
  });
```

### T-2: Failed Sale (Payment FAILED)

```typescript
  it('T-2: marks sale FAILED and restores inventory on payment FAILED', async () => {
    const initialQty = await getInventoryQty(SEED.store1Id, SEED.product1Id);

    const response = await request(app.getHttpServer())
      .post(`/api/v1/stores/${SEED.store1Id}/sales`)
      .set('Authorization', `Bearer ${cashierToken}`)
      .set('Idempotency-Key', randomUUID())
      .send({
        items: [{ productId: SEED.product1Id, quantity: 1 }],
        paymentMetadata: { simulateFailure: true },  // force FAILED
      });

    expect(response.status).toBe(402);
    expect(response.body.error).toBe('PAYMENT_FAILED');

    // Inventory must be restored (compensation ran)
    const finalQty = await getInventoryQty(SEED.store1Id, SEED.product1Id);
    expect(finalQty).toBe(initialQty);  // unchanged after compensation
  });
});
```

### T-3: Insufficient Inventory

```typescript
// test/inventory.e2e-spec.ts
describe('Inventory enforcement', () => {
  it('T-3: rejects sale when requested qty exceeds stock', async () => {
    // Seed: product has qty=5
    const response = await request(app.getHttpServer())
      .post(`/api/v1/stores/${SEED.store1Id}/sales`)
      .set('Authorization', `Bearer ${cashierToken}`)
      .set('Idempotency-Key', randomUUID())
      .send({
        items: [{ productId: SEED.product1Id, quantity: 999 }],
      });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('INSUFFICIENT_INVENTORY');

    // No sale created, no inventory change
    const inv = await getInventoryQty(SEED.store1Id, SEED.product1Id);
    expect(inv.quantity).toBe(5);  // unchanged
  });
});
```

### T-4: Cross-Tenant Access Rejected

```typescript
// test/tenant-isolation.e2e-spec.ts
describe('Tenant isolation', () => {
  it('T-4a: rejects GET on another tenant\'s product', async () => {
    // merchantA cashier tries to read merchantB product
    const response = await request(app.getHttpServer())
      .get(`/api/v1/products/${SEED.merchantBProduct1Id}`)
      .set('Authorization', `Bearer ${merchantACashierToken}`);

    expect(response.status).toBe(404);  // scoped query returns nothing → 404
  });

  it('T-4b: rejects POST /sales to another tenant\'s store', async () => {
    // merchantA cashier tries to POST to merchantB's store
    const response = await request(app.getHttpServer())
      .post(`/api/v1/stores/${SEED.store3Id}/sales`)  // store3 = merchantB
      .set('Authorization', `Bearer ${merchantACashierToken}`)
      .set('Idempotency-Key', randomUUID())
      .send({ items: [{ productId: SEED.merchantBProduct1Id, quantity: 1 }] });

    expect(response.status).toBe(403);  // StoreAccessGuard blocks it
  });
});
```

### T-5: Duplicate Request (Idempotency)

```typescript
// test/idempotency.e2e-spec.ts
describe('Idempotency', () => {
  it('T-5: duplicate POST /sales with same Idempotency-Key returns same result without creating a second sale', async () => {
    const key = randomUUID();
    const payload = {
      items: [{ productId: SEED.product2Id, quantity: 1 }],
    };

    // First request
    const first = await request(app.getHttpServer())
      .post(`/api/v1/stores/${SEED.store1Id}/sales`)
      .set('Authorization', `Bearer ${cashierToken}`)
      .set('Idempotency-Key', key)
      .send(payload);

    expect(first.status).toBe(201);
    const saleId = first.body.data.id;

    // Second request (retry with same key)
    const second = await request(app.getHttpServer())
      .post(`/api/v1/stores/${SEED.store1Id}/sales`)
      .set('Authorization', `Bearer ${cashierToken}`)
      .set('Idempotency-Key', key)
      .send(payload);

    expect(second.status).toBe(200);  // replay
    expect(second.headers['x-idempotency-replayed']).toBe('true');
    expect(second.body.data.id).toBe(saleId);  // same sale ID

    // Only one sale exists in DB
    const salesCount = await salesRepo.count({ where: { storeId: SEED.store1Id } });
    expect(salesCount).toBe(1);  // not 2
  });
});
```

---

## 5. Bonus: Concurrent Inventory Test

```typescript
// src/modules/sales/sales.service.concurrent.spec.ts
describe('BONUS: Concurrent sales', () => {
  it('prevents overselling when two requests compete for the same stock', async () => {
    // Setup: qty=5, two requests both want qty=3
    const results = await Promise.allSettled([
      saleService.createSale(
        { items: [{ productId, quantity: 3 }], paymentMetadata: {} },
        cashier1JwtPayload,
      ),
      saleService.createSale(
        { items: [{ productId, quantity: 3 }], paymentMetadata: {} },
        cashier2JwtPayload,
      ),
    ]);

    const statuses = results.map(r => r.status);
    // Exactly one fulfilled (sale created), one rejected (insufficient stock)
    expect(statuses.filter(s => s === 'fulfilled')).toHaveLength(1);
    expect(statuses.filter(s => s === 'rejected')).toHaveLength(1);

    // Final inventory: 5 - 3 = 2 (not -1)
    const finalInv = await inventoryRepo.findOne(storeId, productId);
    expect(finalInv.quantity).toBe(2);
  });
});
```

---

## 6. Unit Test Coverage Plan (Service Layer)

| Service | Key Scenarios Tested |
|---|---|
| `AuthService` | Valid login, wrong password, inactive user, JWT shape |
| `SalesService` | All T-1 through T-5 paths, price calculation correctness, multi-product totals |
| `InventoryService` | Stock update, negative stock rejection at CHECK constraint level |
| `IdempotencyService` | Key insert, replay, in-flight detection, hash mismatch |
| `ProductsService` | Cache hit/miss, invalidation on update |

---

## 7. Test Database Handling

| Concern | Approach |
|---|---|
| Isolation | Each e2e test suite uses `TRUNCATE ... CASCADE` in `beforeEach` + re-seed |
| Test DB | Separate `pos_test` database configured via `DATABASE_TEST_URL` env var |
| Migrations | Run once in `beforeAll` via TypeORM `DataSource.runMigrations()` |
| Seed | Fixed UUIDs + known passwords in `test/seeds/` |
| CI environment | Docker Compose with PostgreSQL + Redis for CI; same `docker-compose.test.yml` |
