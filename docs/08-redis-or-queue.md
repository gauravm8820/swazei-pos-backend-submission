# 08 — Redis / Async Queue Decision

## 1. Choice: Redis Caching (not BullMQ queue)

**Selected: Redis caching for read-heavy product and inventory endpoints.**

---

## 2. Rationale

The assignment requires implementing **one** of: Redis caching or async queue. Here is the comparison for this specific system:

| Factor | Redis Caching | BullMQ Async Queue |
|---|---|---|
| **Fit for POS workload** | ✅ POS reads product catalog and inventory before every sale — highly repetitive reads | ⚠️ Async processing suits batch work (reports, emails, reconciliation) — not the core POS flow |
| **Assignment coverage** | ✅ Directly accelerates the most common POS operations | ✅ Would cover async payment retries, but Mock provider is synchronous |
| **Demonstrable value** | ✅ Measurable: response time with/without cache | ⚠️ Queue benefit is invisible in unit/e2e tests without a running worker |
| **Complexity for 14h** | ✅ Straightforward `cache-manager` + `ioredis` setup | ⚠️ BullMQ requires worker process, job types, dead-letter queue, monitoring |
| **Operational simplicity** | ✅ Single Redis connection | ⚠️ Queue adds retry logic, job state, concurrency control |

**Decision**: Redis caching provides immediate, demonstrable, and reviewable value with lower implementation risk.

> **Documented future use of BullMQ**: Receipt email delivery, end-of-day sales report generation, payment reconciliation for stuck PENDING sales.

---

## 3. What Gets Cached

### 3.1 — Product Catalog (per merchant)

**Pattern**: Cache-Aside (read-through on miss)

| Detail | Value |
|---|---|
| Cache key | `product:{merchantId}:{productId}` |
| List key | `products:merchant:{merchantId}` |
| TTL | **300 seconds** (5 minutes) |
| Invalidation | On `POST/PATCH/DELETE /products` — delete `product:{merchantId}:{productId}` and `products:merchant:{merchantId}` |
| Reason | Product catalog changes infrequently; POS reads products on every sale screen load |

### 3.2 — Store Inventory Snapshot (per store)

**Pattern**: Cache-Aside, SHORT TTL

| Detail | Value |
|---|---|
| Cache key | `inventory:store:{storeId}:product:{productId}` |
| TTL | **30 seconds** |
| Invalidation | On inventory update (`PUT /inventory`) — delete the specific key |
| Reason | Inventory changes frequently (every sale); short TTL prevents stale stock display on POS. The actual stock check during sale creation is always done against the DB (with `FOR UPDATE`) — cache is only for display reads |

> **Critical**: The inventory cache is for **read display only**. The authoritative stock check in `createSale` always reads from the DB with `SELECT ... FOR UPDATE`. Cache staleness cannot cause overselling.

### 3.3 — Store Access Validation (per user + storeId)

**Pattern**: Cache-Aside

| Detail | Value |
|---|---|
| Cache key | `store_access:{merchantId}:{storeId}` |
| TTL | **60 seconds** |
| Invalidation | On store PATCH/DELETE |
| Reason | `StoreAccessGuard` runs on every request to a store-scoped endpoint; DB query on every request is wasteful |

---

## 4. Cache Key Design Summary

```
product:{merchantId}:{productId}           → Product JSON
products:merchant:{merchantId}             → Product[] JSON (paginated list)
inventory:store:{storeId}:product:{pid}    → { quantity: number }
store_access:{merchantId}:{storeId}        → { exists: boolean }
```

All keys are prefixed by entity type and tenant scope. This prevents cross-tenant key collisions and makes cache inspection (via `redis-cli KEYS`) straightforward during debugging.

---

## 5. Implementation Stack

```
cache-manager v5         → NestJS CacheModule integration
cache-manager-ioredis    → Redis adapter
ioredis                  → Redis client (supports cluster, sentinel in future)
```

```typescript
// src/redis/redis.module.ts
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: (config: ConfigService) => ({
        store: redisStore,
        host: config.get('REDIS_HOST'),
        port: config.get('REDIS_PORT'),
        password: config.get('REDIS_PASSWORD'),
        ttl: 300,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class RedisModule {}
```

---

## 6. Trade-Offs and Edge Cases

| Trade-Off | Mitigation |
|---|---|
| Stale product prices shown on POS | Short TTL (5 min) + immediate invalidation on price update |
| Stale inventory displayed (e.g. shows qty=5 but it's 2) | Short TTL (30s) + authoritative DB check during sale creation |
| Redis unavailability | `CacheModule` is used in a non-blocking pattern; if Redis is down, the code falls back to DB reads (cache miss path). We wrap cache calls in try/catch and log warnings. |
| Cache stampede on cold start | Short jitter added to TTL: `TTL ± 10%` randomization to avoid many keys expiring simultaneously |

---

## 7. Future: BullMQ Integration Points

When async processing is needed (outside assignment scope):

```
Queue: receipt-email     → Job: { saleId } → send email receipt
Queue: daily-report      → Job: { merchantId, date } → generate PDF
Queue: payment-reconcile → Job: { saleId } → check PENDING sales older than 10 min
Queue: inventory-alert   → Job: { storeId } → notify when stock < threshold
```
