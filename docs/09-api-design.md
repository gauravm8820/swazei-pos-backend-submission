# 09 — API Design

## 1. Global Conventions

| Convention | Decision |
|---|---|
| Base path | `/api/v1` |
| Versioning | URI versioning (`/api/v1/`, `/api/v2/`) |
| Auth | `Authorization: Bearer <JWT>` on all endpoints except `/auth/login` |
| Idempotency | `Idempotency-Key: <uuid>` header on `POST /sales` (required) |
| Pagination | `?page=1&limit=20` (default limit: 20, max: 100) |
| Sorting | `?sortBy=created_at&order=desc` |
| Content-Type | `application/json` |
| Swagger | Enabled at `/api/docs` in non-production environments |

---

## 2. Standard Response / Error Format

### Success (list)
```json
{
  "data": [...],
  "meta": { "page": 1, "limit": 20, "total": 45, "totalPages": 3 }
}
```

### Success (single object)
```json
{ "data": { ... } }
```

### Error
```json
{
  "statusCode": 422,
  "error": "INSUFFICIENT_INVENTORY",
  "message": "Product 'Coffee Mug' has only 2 units available, requested 3",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/sales"
}
```

---

## 3. Endpoints

### Auth

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/login` | ❌ | — | Login, returns access + refresh JWT |
| `POST` | `/api/v1/auth/refresh` | ❌ | — | Refresh access token |
| `GET` | `/api/v1/auth/me` | ✅ | All | Get current user profile |

#### POST /auth/login — Request
```json
{ "email": "cashier@merchant-a.com", "password": "password123" }
```
#### POST /auth/login — Response 200
```json
{
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 3600,
    "user": { "id": "uuid", "email": "...", "role": "CASHIER", "storeId": "uuid" }
  }
}
```

---

### Merchants

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/merchants/me` | ✅ | OWNER, ADMIN | Get own merchant info |
| `PATCH` | `/api/v1/merchants/me` | ✅ | OWNER | Update merchant |

---

### Stores

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/stores` | ✅ | OWNER, ADMIN | Create store |
| `GET` | `/api/v1/stores` | ✅ | OWNER, ADMIN | List stores (merchant-scoped) |
| `GET` | `/api/v1/stores/:storeId` | ✅ | OWNER, ADMIN, MANAGER | Get store |
| `PATCH` | `/api/v1/stores/:storeId` | ✅ | OWNER, ADMIN | Update store |
| `DELETE` | `/api/v1/stores/:storeId` | ✅ | OWNER | Deactivate store |

---

### Users

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/users` | ✅ | OWNER, ADMIN | Create user in merchant |
| `GET` | `/api/v1/users` | ✅ | OWNER, ADMIN | List users (merchant-scoped) |
| `GET` | `/api/v1/users/:userId` | ✅ | OWNER, ADMIN, MANAGER | Get user |
| `PATCH` | `/api/v1/users/:userId` | ✅ | OWNER, ADMIN | Update user |
| `DELETE` | `/api/v1/users/:userId` | ✅ | OWNER, ADMIN | Soft-delete user |

#### POST /users — Request
```json
{
  "email": "manager@store1.com",
  "password": "securepass",
  "role": "MANAGER",
  "storeId": "uuid-of-store"
}
```

---

### Products

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/products` | ✅ | OWNER, ADMIN | Create product (merchant catalog) |
| `GET` | `/api/v1/products` | ✅ | All | List products for merchant (cached) |
| `GET` | `/api/v1/products/:productId` | ✅ | All | Get product (cached) |
| `PATCH` | `/api/v1/products/:productId` | ✅ | OWNER, ADMIN | Update product (invalidates cache) |
| `DELETE` | `/api/v1/products/:productId` | ✅ | OWNER, ADMIN | Soft-delete product |

#### POST /products — Request
```json
{
  "name": "Espresso",
  "description": "Single shot espresso",
  "priceMinorUnits": 18000,
  "currency": "INR",
  "sku": "ESP-001"
}
```
#### GET /products — Response 200
```json
{
  "data": [
    { "id": "uuid", "name": "Espresso", "priceMinorUnits": 18000, "currency": "INR", "sku": "ESP-001", "isActive": true }
  ],
  "meta": { "page": 1, "limit": 20, "total": 3 }
}
```

---

### Inventory

Inventory is store-scoped. MANAGER/CASHIER can only access their own store's inventory (derived from JWT `storeId`). OWNER/ADMIN must specify `:storeId`.

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/stores/:storeId/inventory` | ✅ | All | List inventory for store (cached) |
| `GET` | `/api/v1/stores/:storeId/inventory/:productId` | ✅ | All | Get stock for specific product |
| `PUT` | `/api/v1/stores/:storeId/inventory/:productId` | ✅ | OWNER, ADMIN, MANAGER | Set/update stock quantity |

#### PUT /inventory/:productId — Request
```json
{ "quantity": 50 }
```
#### GET /inventory — Response 200
```json
{
  "data": [
    { "productId": "uuid", "productName": "Espresso", "quantity": 42, "sku": "ESP-001" }
  ],
  "meta": { "page": 1, "limit": 20, "total": 3 }
}
```

---

### Sales

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/stores/:storeId/sales` | ✅ | All | Create sale (requires Idempotency-Key) |
| `GET` | `/api/v1/stores/:storeId/sales` | ✅ | All | List sales for store |
| `GET` | `/api/v1/stores/:storeId/sales/:saleId` | ✅ | All | Get sale detail with items |

#### POST /sales — Request Headers
```
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json
Authorization: Bearer eyJ...
```
#### POST /sales — Request Body
```json
{
  "items": [
    { "productId": "uuid-product-1", "quantity": 2 },
    { "productId": "uuid-product-2", "quantity": 1 }
  ],
  "paymentMetadata": {
    "simulateFailure": false
  }
}
```
#### POST /sales — Response 201
```json
{
  "data": {
    "id": "uuid-sale",
    "status": "PAID",
    "totalMinorUnits": 54000,
    "currency": "INR",
    "items": [
      { "productId": "uuid", "productName": "Espresso", "quantity": 2, "unitPriceSnapshot": 18000, "subtotal": 36000 },
      { "productId": "uuid", "productName": "Croissant", "quantity": 1, "unitPriceSnapshot": 18000, "subtotal": 18000 }
    ],
    "payment": { "status": "SUCCESS", "providerReference": "mock_txn_..." },
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Error Responses

| Scenario | Status | `error` code |
|---|---|---|
| Missing `Idempotency-Key` header | `400` | `MISSING_IDEMPOTENCY_KEY` |
| Key reused with different payload | `422` | `IDEMPOTENCY_KEY_CONFLICT` |
| Request already in flight | `409` | `REQUEST_IN_FLIGHT` |
| Replay of completed request | `200` | — (`X-Idempotency-Replayed: true`) |
| Product not found in merchant catalog | `422` | `PRODUCT_NOT_FOUND` |
| Insufficient inventory | `422` | `INSUFFICIENT_INVENTORY` |
| Payment failed | `402` | `PAYMENT_FAILED` |
| Cross-tenant store access | `403` | `FORBIDDEN` |

---

## 4. Validation Rules

### CreateSaleDto
- `items`: array, min 1 item, max 50 items
- `items[].productId`: UUID, required
- `items[].quantity`: integer, min 1, max 999

### CreateProductDto
- `name`: string, 1–300 chars
- `priceMinorUnits`: integer, min 0
- `currency`: string, exactly 3 chars, uppercase
- `sku`: string, 1–100 chars, alphanumeric + hyphens

### UpdateInventoryDto
- `quantity`: integer, min 0 (allows zeroing stock)

---

## 5. Swagger / OpenAPI

- Enabled via `@nestjs/swagger` at `/api/docs` when `NODE_ENV !== 'production'`
- All DTOs annotated with `@ApiProperty()`
- Bearer token auth configured in Swagger UI
- Response schemas defined with `@ApiResponse()` on each controller method
- Exported as `postman/openapi.json` for Postman collection generation

---

## 6. Health Check

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/health` | ❌ | Returns `{ status: "ok", db: "ok", redis: "ok" }` |
