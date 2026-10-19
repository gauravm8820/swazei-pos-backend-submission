# 05 — Concurrency Strategy

## 1. The Problem

```
store_inventory: { store_id: S1, product_id: P1, quantity: 5 }

T1 (POS A): wants to sell 3 units
T2 (POS B): wants to sell 3 units
```

Both arrive simultaneously. Without protection, both read `qty=5`, both see sufficient stock, both decrement, final quantity = `-1` (oversold).

---

## 2. Strategy Comparison

| Strategy | Mechanism | Pros | Cons | Verdict |
|---|---|---|---|---|
| **A — SELECT … FOR UPDATE (pessimistic)** | Row-level exclusive lock acquired at read time. T2 waits at the `SELECT FOR UPDATE` until T1 commits or rolls back. | Deterministic; no retry logic needed; simple to reason about | Locking overhead; T2 waits (latency spike); potential deadlock with multiple products | ✅ **Chosen** |
| **B — Atomic conditional UPDATE** | `UPDATE store_inventory SET quantity = quantity - n WHERE store_id=? AND product_id=? AND quantity >= n` + check `rowsAffected` | No read needed; elegant for single-product sales | Cannot easily validate stock and gather product info in same step; less readable for multi-product validation | Considered but rejected for multi-product complexity |
| **C — Optimistic locking (version column)** | Add `version` column; `UPDATE … WHERE version = ?`; retry on version mismatch | No lock contention in happy path | Retry logic needed in application; under high contention can retry many times | Rejected — adds retry complexity and is worse than pessimistic under high contention |
| **D — Serializable isolation** | `SET TRANSACTION ISOLATION LEVEL SERIALIZABLE` | Strongest guarantee; no explicit locks needed | Serialization failures → retries; higher abort rate; overkill for row-level conflict | Rejected — `FOR UPDATE` is targeted and sufficient |

---

## 3. ✅ Chosen: Pessimistic Locking with `SELECT … FOR UPDATE`

### How It Works

```sql
-- Inside a READ COMMITTED transaction:
BEGIN;

-- 1. Lock inventory rows for ALL products in the sale atomically
SELECT si.*, p.price_minor_units, p.name
FROM store_inventory si
JOIN products p ON p.id = si.product_id
WHERE si.store_id = $store_id
  AND si.product_id = ANY($product_ids)
FOR UPDATE;   -- <-- exclusive row locks

-- 2. Application validates qty_requested <= qty_available for each product

-- 3. Insert sale + sale_items

-- 4. Decrement inventory
UPDATE store_inventory
SET quantity = quantity - $qty, updated_at = now()
WHERE store_id = $store_id AND product_id = $product_id;

COMMIT;
```

### The Race Condition Resolved

```
Time →   T1            T2
         FOR UPDATE    blocks (waiting for T1's locks)
         validates: 5 >= 3 ✓
         decrement → qty=2
         COMMIT
                       acquires locks
                       reads: qty=2
                       validates: 2 >= 3 ✗  FAIL
                       ROLLBACK → 422
```

Exactly one succeeds. The other gets a 422 Insufficient Inventory response.

---

## 4. Deadlock Avoidance

When a sale contains **multiple products**, two concurrent transactions could deadlock if they lock products in different orders:

```
T1 locks P1, then tries to lock P2  →  blocked by T2
T2 locks P2, then tries to lock P1  →  blocked by T1  → DEADLOCK
```

**Solution: Always sort product IDs in ascending UUID order before acquiring locks.**

```typescript
// In SalesService.createSale():
const sortedProductIds = [...dto.items.map(i => i.productId)].sort();
// The SELECT FOR UPDATE uses this sorted order
```

PostgreSQL will serialize both transactions through the same lock order, and one will wait while the other completes — no deadlock possible.

---

## 5. Retry Policy

| Scenario | Behavior |
|---|---|
| T2 waits and then fails validation (insufficient stock) | Returns 422 — no retry needed |
| DB deadlock detected (PostgreSQL error code 40P01) | Retry once with exponential backoff (max 1 retry, 100ms delay) |
| Lock timeout (PostgreSQL `lock_timeout`) | Returns 503 — POS terminal retries with same idempotency key |
| Normal concurrency (T2 waits for T1's commit) | No retry needed — T2 proceeds with updated state |

We set `lock_timeout = 5000` (5 seconds) via TypeORM query runner before the `FOR UPDATE`, preventing indefinite waits from cascading into connection pool exhaustion.

---

## 6. Isolation Level Justification

**READ COMMITTED** (PostgreSQL default) is used:
- `SELECT … FOR UPDATE` within READ COMMITTED acquires row-level locks that prevent concurrent modification — this is sufficient.
- Phantom rows are not a concern: we lock exactly the rows we need (specific `product_id` values).
- READ COMMITTED is lighter than REPEATABLE READ or SERIALIZABLE, preserving throughput for concurrent non-conflicting sales.

---

## 7. Bonus: Concurrency Test Approach

```typescript
// concurrent-sale.spec.ts (bonus test)
it('should prevent overselling when two POS terminals sell simultaneously', async () => {
  // Setup: qty=5
  const [result1, result2] = await Promise.all([
    saleService.createSale({ items: [{ productId, qty: 3 }], ... }, cashier1Payload),
    saleService.createSale({ items: [{ productId, qty: 3 }], ... }, cashier2Payload),
  ]);

  const statuses = [result1.status, result2.status].sort();
  expect(statuses).toContain('PAID');     // one succeeds
  expect(statuses).toContain('FAILED');   // one gets 422

  const finalQty = await inventoryRepo.findOne(...);
  expect(finalQty.quantity).toBe(2);      // 5 - 3 = 2, not -1
});
```
