# 04 — Sale Flow and Transactions

## 1. Create Sale — Sequence Diagram

```mermaid
sequenceDiagram
    participant POS as POS Terminal
    participant API as POST /sales
    participant Idem as IdempotencyInterceptor
    participant Guard as Guards (JWT + RBAC + Store)
    participant SVC as SalesService
    participant DB as PostgreSQL
    participant Pay as PaymentPort (Mock)

    POS->>API: POST /sales { items, idempotency_key }

    API->>Idem: check idempotency_key
    alt key seen + complete
        Idem-->>POS: 200 (replayed cached response)
    else key seen + in-flight
        Idem-->>POS: 409 Conflict (processing)
    else key new
        Idem->>Idem: insert row (is_processing=true)
    end

    Idem->>Guard: pass through
    Guard->>Guard: validate JWT, RBAC, store ownership
    Guard-->>POS: 401/403 if invalid

    Guard->>SVC: createSale(dto, jwtPayload)

    SVC->>DB: BEGIN TRANSACTION (READ COMMITTED)

    SVC->>DB: SELECT products WHERE id IN (...) AND merchant_id = ?
    DB-->>SVC: product rows (with current prices)
    SVC->>SVC: verify all products found & active

    SVC->>DB: SELECT ... FROM store_inventory<br/>WHERE store_id=? AND product_id IN (?)<br/>FOR UPDATE (row-level lock)
    DB-->>SVC: inventory rows (locked)

    SVC->>SVC: check each qty_requested <= qty_available
    alt insufficient stock
        SVC->>DB: ROLLBACK
        SVC-->>POS: 422 Insufficient Inventory
    end

    SVC->>SVC: calculate total = Σ (qty × server_price)

    SVC->>DB: INSERT sales (status=PENDING, total=?)
    SVC->>DB: INSERT sale_items (price_snapshot=server_price for each)

    SVC->>DB: UPDATE store_inventory<br/>SET quantity = quantity - qty<br/>WHERE store_id=? AND product_id=?

    SVC->>DB: COMMIT TRANSACTION
    Note over SVC,DB: Inventory decremented inside TX.<br/>Payment called OUTSIDE the TX.

    SVC->>Pay: charge({ saleId, amount, currency })
    Pay-->>SVC: { status: SUCCESS | FAILED, ref }

    alt payment SUCCESS
        SVC->>DB: UPDATE sales SET status=PAID
        SVC->>DB: INSERT payments (status=SUCCESS)
        SVC-->>Idem: store response (200 body)
        Idem-->>POS: 201 Created (sale + payment)
    else payment FAILED
        SVC->>DB: BEGIN TRANSACTION
        SVC->>DB: UPDATE sales SET status=FAILED
        SVC->>DB: INSERT payments (status=FAILED)
        SVC->>DB: UPDATE store_inventory SET quantity = quantity + qty (compensate)
        SVC->>DB: COMMIT TRANSACTION
        SVC-->>Idem: store response (402 body)
        Idem-->>POS: 402 Payment Required
    end
```

---

## 2. Payment vs DB Transaction: The Critical Decision

### The Problem
The payment call is to an external mock provider. In a real system it would be an HTTP call that can take 2–30 seconds. Holding a PostgreSQL transaction open for that duration would:
- Hold row locks on inventory rows (blocking other POS terminals)
- Exhaust the DB connection pool
- Turn a slow payment provider into an API-wide bottleneck

### Options Considered

| Approach | Description | Problem |
|---|---|---|
| **A — Payment inside TX** | Open TX → decrement inventory → call payment → commit | Holds locks during I/O; terrible under load |
| **B — Payment before TX** (optimistic) | Charge first → open TX → decrement inventory | Double charge risk on crash between payment and TX commit |
| **C — Payment outside TX (chosen)** | Open TX → decrement inventory → commit → call payment → compensate on failure | Short lock time; compensation handles failure |
| **D — Saga / outbox** | Event-driven, eventual consistency | Overkill for this scope; adds significant complexity |

### ✅ Chosen: Option C — Decrement First, Then Pay, Compensate on Failure

**Why**:
1. The DB transaction is short (only inventory check + decrement + sale insert — no I/O).
2. If payment fails, a **compensation transaction** re-increments inventory and marks the sale FAILED.
3. Crash between payment success and the status update? The sale stays PENDING — a background reconciliation job (future scope) or a re-query to the payment provider by idempotency-key would resolve it.
4. Risk of "ghost decrement" (inventory decremented, payment never completed, no compensation) is addressed by idempotency: a retry will hit the stored 402 response and not re-process.

### Failure Handling Table

| Failure Point | State | Recovery |
|---|---|---|
| DB TX fails during validation | Nothing committed | Transaction rolled back; 422 returned |
| DB TX fails after inventory decrement (pre-commit) | Nothing committed | Auto-rollback; 500 returned; safe to retry with same idempotency key |
| Payment returns FAILED | Sale PENDING, inventory decremented | Compensation TX: increment inventory + set sale FAILED + create payment record |
| Payment returns SUCCESS, status update fails | Sale PENDING but actually paid | Idempotency key stored with 201 body before crash risk; future reconciliation |
| Crash between payment.SUCCESS and status update | Sale stays PENDING | Idempotency key not finalized → retry re-fetches from payment provider (future) or manual reconciliation |
| Duplicate request (idempotency replay) | Already stored response | Return cached 201/402 without re-executing |
| Insufficient stock | No sale/payment created | TX rolled back; 422 returned |

---

## 3. Sale / Payment State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING : Sale created (inventory reserved)

    PENDING --> PAID : Payment SUCCESS + status updated
    PENDING --> FAILED : Payment FAILED + inventory restored
    PENDING --> PENDING : Crash / timeout (needs reconciliation)

    PAID --> REFUNDED : Manual refund (future scope)

    FAILED --> [*] : Terminal state
    PAID --> [*] : Terminal (unless refunded)
    REFUNDED --> [*] : Terminal state
```

**Payment record** mirrors sale status:

```
sale.status=PENDING  ↔  payment.status=PENDING
sale.status=PAID     ↔  payment.status=SUCCESS
sale.status=FAILED   ↔  payment.status=FAILED
```

---

## 4. Transaction Isolation Level

We use **READ COMMITTED** (PostgreSQL default) for the main sale transaction. This is sufficient because:
- We use `SELECT ... FOR UPDATE` to lock inventory rows, preventing concurrent reads of stale stock.
- REPEATABLE READ would not add protection beyond what `FOR UPDATE` already provides.
- SERIALIZABLE adds overhead; we handle concurrency with explicit locking (see `05-concurrency-strategy.md`).
