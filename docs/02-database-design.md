# 02 — Database Design

## 1. Core Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Product catalog scope | **Merchant-level** | Products are defined once per merchant and shared across that merchant's stores. Each store maintains its own *inventory* (stock count) for the shared catalog. This avoids data duplication and lets merchants synchronize pricing/names across all their stores. A store that stocks a product just has a row in `store_inventory`. |
| Money representation | **Integer minor units (cents)** | e.g., \$12.99 → `1299`. Eliminates floating-point rounding. All arithmetic in the DB stays integer math. `BIGINT` gives headroom up to \~92 quadrillion cents. |
| Price snapshot | `sale_items.unit_price_snapshot` | Server-side price at sale time, stored forever. Protects against price changes invalidating historical sale totals. |
| Soft delete | **Only on `users` and `products`** | Keeps audit history. `stores` and `merchants` use hard delete (rare, owner action). |
| Timestamps | `created_at`, `updated_at` on every table | `updated_at` managed by TypeORM `@UpdateDateColumn`. |
| UUIDs | **UUID v4 (`uuid` PG extension)** for all PKs | No sequential enumeration; safe to expose in APIs. |
| `idempotency_keys` table | Stores key + request hash + stored response | Enables replay without re-executing the sale. |

---

## 2. ER Diagram

```mermaid
erDiagram
    merchants {
        uuid id PK
        varchar name
        varchar slug UK
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    stores {
        uuid id PK
        uuid merchant_id FK
        varchar name
        varchar address
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    users {
        uuid id PK
        uuid merchant_id FK
        uuid store_id FK "nullable — OWNER/ADMIN are merchant-level"
        varchar email UK
        varchar password_hash
        enum role "OWNER|ADMIN|MANAGER|CASHIER"
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at "soft delete"
    }

    products {
        uuid id PK
        uuid merchant_id FK
        varchar name
        text description
        bigint price_minor_units "e.g. 1299 = $12.99"
        varchar currency "ISO 4217 e.g. INR"
        varchar sku UK_per_merchant
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at "soft delete"
    }

    store_inventory {
        uuid id PK
        uuid store_id FK
        uuid product_id FK
        integer quantity "CHECK >= 0"
        timestamptz created_at
        timestamptz updated_at
    }

    sales {
        uuid id PK
        uuid store_id FK
        uuid cashier_id FK "user who created"
        enum status "PENDING|PAID|FAILED|REFUNDED"
        bigint total_minor_units
        varchar currency
        varchar idempotency_key UK
        timestamptz created_at
        timestamptz updated_at
    }

    sale_items {
        uuid id PK
        uuid sale_id FK
        uuid product_id FK
        integer quantity
        bigint unit_price_snapshot "price at time of sale"
        bigint subtotal_minor_units
    }

    payments {
        uuid id PK
        uuid sale_id FK UK
        enum status "PENDING|SUCCESS|FAILED"
        varchar provider "mock"
        varchar provider_reference "external tx id"
        bigint amount_minor_units
        varchar currency
        jsonb provider_response "raw provider payload"
        timestamptz created_at
        timestamptz updated_at
    }

    idempotency_keys {
        uuid id PK
        uuid store_id FK
        varchar key "client-supplied Idempotency-Key header"
        varchar request_hash "SHA-256 of method+path+body"
        integer response_status
        jsonb response_body
        boolean is_processing "lock flag for in-flight duplicates"
        timestamptz expires_at
        timestamptz created_at
    }

    merchants ||--o{ stores : "has"
    merchants ||--o{ users : "has"
    merchants ||--o{ products : "defines"
    stores ||--o{ users : "has"
    stores ||--o{ store_inventory : "tracks"
    stores ||--o{ sales : "records"
    products ||--o{ store_inventory : "stocked_in"
    products ||--o{ sale_items : "appears_in"
    sales ||--o{ sale_items : "contains"
    sales ||--|| payments : "has"
    sales }o--|| users : "created_by"
```

---

## 3. Tables — Full Column Specification

### `merchants`
| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK, DEFAULT uuid_generate_v4() |
| `name` | `varchar(200)` | NOT NULL |
| `slug` | `varchar(100)` | NOT NULL, UNIQUE |
| `is_active` | `boolean` | NOT NULL, DEFAULT true |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() |

### `stores`
| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `merchant_id` | `uuid` | NOT NULL, FK → merchants(id) ON DELETE CASCADE |
| `name` | `varchar(200)` | NOT NULL |
| `address` | `text` | |
| `is_active` | `boolean` | NOT NULL, DEFAULT true |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL |

### `users`
| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `merchant_id` | `uuid` | NOT NULL, FK → merchants(id) |
| `store_id` | `uuid` | nullable, FK → stores(id) — OWNER/ADMIN have no store; MANAGER/CASHIER must have one |
| `email` | `varchar(254)` | NOT NULL, UNIQUE |
| `password_hash` | `varchar(255)` | NOT NULL |
| `role` | `enum` | NOT NULL — `OWNER`, `ADMIN`, `MANAGER`, `CASHIER` |
| `is_active` | `boolean` | NOT NULL, DEFAULT true |
| `deleted_at` | `timestamptz` | nullable (soft delete) |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL |

**CHECK**: `(role IN ('OWNER','ADMIN') AND store_id IS NULL) OR (role IN ('MANAGER','CASHIER') AND store_id IS NOT NULL)` — enforced in application layer (DB constraint is advisory).

### `products`
| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `merchant_id` | `uuid` | NOT NULL, FK → merchants(id) |
| `name` | `varchar(300)` | NOT NULL |
| `description` | `text` | |
| `price_minor_units` | `bigint` | NOT NULL, CHECK ≥ 0 |
| `currency` | `varchar(3)` | NOT NULL, DEFAULT 'INR' |
| `sku` | `varchar(100)` | NOT NULL |
| `is_active` | `boolean` | NOT NULL, DEFAULT true |
| `deleted_at` | `timestamptz` | nullable |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL |

**UNIQUE**: `(merchant_id, sku)` — SKU is unique per merchant, not globally.

### `store_inventory`
| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `store_id` | `uuid` | NOT NULL, FK → stores(id) |
| `product_id` | `uuid` | NOT NULL, FK → products(id) |
| `quantity` | `integer` | NOT NULL, DEFAULT 0, **CHECK (quantity >= 0)** |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL |

**UNIQUE**: `(store_id, product_id)` — one row per product per store.

### `sales`
| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `store_id` | `uuid` | NOT NULL, FK → stores(id) |
| `cashier_id` | `uuid` | NOT NULL, FK → users(id) |
| `status` | `enum` | NOT NULL, DEFAULT 'PENDING' |
| `total_minor_units` | `bigint` | NOT NULL, CHECK ≥ 0 |
| `currency` | `varchar(3)` | NOT NULL |
| `idempotency_key` | `varchar(255)` | UNIQUE (enforced via `idempotency_keys` table) |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL |

### `sale_items`
| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `sale_id` | `uuid` | NOT NULL, FK → sales(id) ON DELETE CASCADE |
| `product_id` | `uuid` | NOT NULL, FK → products(id) |
| `quantity` | `integer` | NOT NULL, CHECK ≥ 1 |
| `unit_price_snapshot` | `bigint` | NOT NULL — copy of `products.price_minor_units` at sale time |
| `subtotal_minor_units` | `bigint` | NOT NULL — `quantity × unit_price_snapshot` |

### `payments`
| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `sale_id` | `uuid` | NOT NULL, UNIQUE, FK → sales(id) |
| `status` | `enum` | NOT NULL, DEFAULT 'PENDING' |
| `provider` | `varchar(50)` | NOT NULL, DEFAULT 'mock' |
| `provider_reference` | `varchar(255)` | |
| `amount_minor_units` | `bigint` | NOT NULL |
| `currency` | `varchar(3)` | NOT NULL |
| `provider_response` | `jsonb` | |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL |

### `idempotency_keys`
| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `store_id` | `uuid` | NOT NULL, FK → stores(id) |
| `key` | `varchar(255)` | NOT NULL |
| `request_hash` | `varchar(64)` | NOT NULL — SHA-256 hex |
| `response_status` | `integer` | nullable (null = in-flight) |
| `response_body` | `jsonb` | nullable |
| `is_processing` | `boolean` | NOT NULL, DEFAULT false |
| `expires_at` | `timestamptz` | NOT NULL |
| `created_at` | `timestamptz` | NOT NULL |

**UNIQUE**: `(store_id, key)` — key scope is per store (one merchant's idempotency key cannot collide with another store's).

---

## 4. Indexes

| Table | Index | Type | Reason |
|---|---|---|---|
| `stores` | `idx_stores_merchant_id` | BTree | Filter stores by merchant (common in guards) |
| `users` | `idx_users_merchant_id` | BTree | Tenant scoping |
| `users` | `idx_users_store_id` | BTree | Store-level user lookup |
| `users` | `idx_users_email` | BTree, UNIQUE | Login lookup |
| `products` | `idx_products_merchant_id` | BTree | Catalog listing per merchant |
| `products` | `idx_products_merchant_sku` | BTree, UNIQUE | SKU uniqueness + lookup |
| `store_inventory` | `idx_inv_store_product` | BTree, UNIQUE | One row enforcement + frequent stock check |
| `sales` | `idx_sales_store_id` | BTree | List sales by store |
| `sales` | `idx_sales_status` | BTree | Filter by PENDING/PAID/FAILED |
| `sales` | `idx_sales_created_at` | BTree | Date-range reports |
| `sale_items` | `idx_sale_items_sale_id` | BTree | Join from sales (FK) |
| `payments` | `idx_payments_sale_id` | BTree, UNIQUE | 1:1 with sale |
| `idempotency_keys` | `idx_idem_store_key` | BTree, UNIQUE | Fast key lookup + uniqueness |
| `idempotency_keys` | `idx_idem_expires_at` | BTree | Background cleanup of expired keys |

---

## 5. Migration Strategy

- **Tool**: TypeORM CLI (`typeorm migration:generate`, `migration:run`)
- **Naming**: `{timestamp}-{description}.ts` e.g. `1700000001-CreateMerchants.ts`
- **Order**: `uuid-ossp` extension → merchants → stores → users → products → store_inventory → sales → sale_items → payments → idempotency_keys

---

## 6. Seed Data Plan

| Entity | Count | Details |
|---|---|---|
| Merchants | 2 | `merchant_a` (slug: `merchant-a`), `merchant_b` (slug: `merchant-b`) |
| Stores | 3 | Store 1 + Store 2 (merchant_a), Store 3 (merchant_b) |
| Users | 6 | 1 OWNER per merchant, 1 MANAGER per store, 1 CASHIER per store |
| Products | 6 | 3 per merchant (merchant-level catalog) |
| Inventory | 9 | Each store stocked with merchant's 3 products (varying quantities) |

Seed provides pre-hashed bcrypt passwords and known UUIDs so tests can reference fixed IDs.

Cross-tenant test: Merchant A's cashier tries to access Merchant B's store → 403 Forbidden.
