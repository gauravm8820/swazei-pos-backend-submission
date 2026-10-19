# Multi-Tenant POS Backend System

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-v10-red.svg)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-red.svg)](https://redis.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-UNLICENSED-lightgrey.svg)]()

Production-grade, multi-tenant Point of Sale (POS) backend platform built with **NestJS**, **TypeScript**, **PostgreSQL 16**, and **Redis 7**. Designed with strict tenant isolation, pessimistic row-level locking for inventory consistency, and transactional idempotency.

---

## Repository Structure

```
.
├── docs/                        # Complete system design documentation (Phase 1)
│   ├── 00-requirements-checklist.md
│   ├── 01-architecture.md
│   ├── 02-database-design.md
│   ├── 03-tenant-isolation.md
│   ├── 04-sale-flow-and-transactions.md
│   ├── 05-concurrency-strategy.md
│   ├── 06-idempotency.md
│   ├── 07-payment-abstraction.md
│   ├── 08-redis-or-queue.md
│   ├── 09-api-design.md
│   ├── 10-testing-plan.md
│   └── 11-implementation-plan.md
├── pos-api/                     # NestJS backend application (Phase 2)
│   ├── docker-compose.yml       # PostgreSQL 16 & Redis 7 services
│   ├── .env.example             # Environment configuration template
│   ├── src/
│   │   ├── common/              # Guards (JWT, Roles, StoreAccess), Filters, Interceptors
│   │   ├── config/              # Joi-validated typed configuration
│   │   ├── database/            # 10 TypeORM migrations & deterministic seed data
│   │   └── modules/             # Auth, Merchants, Stores, Users, Products, Inventory, Sales, Payments, Idempotency, Health
│   ├── test/                    # Full E2E database test suites
│   ├── postman/                 # Ready-to-import Postman collection & environment
│   └── README.md                # Detailed technical README & API documentation
├── .gitignore                   # Multi-layer gitignore excluding build & secret files
└── .env.example                 # Root configuration template
```

---

## Quick Start (How to Run & Verify)

### 1. Prerequisites
- Docker & Docker Compose
- Node.js (v20+ recommended) & npm

### 2. Infrastructure & Application Setup
```bash
# Navigate to the backend directory
cd pos-api

# Create environment file from template
cp .env.example .env

# Start PostgreSQL 16 and Redis 7 in Docker
docker compose up -d

# Install dependencies
npm install

# Run database migrations
npm run migration:run

# Seed sample multi-tenant data
npm run seed

# Start development server
npm run start:dev
```
- API Base URL: `http://localhost:3000/api/v1`
- Interactive Swagger UI: `http://localhost:3000/api/docs`

---

## Automated Test Verification

The project includes unit tests, full database E2E tests, and the concurrent race-condition bonus test:

```bash
cd pos-api

# 1. Run Unit Tests & Concurrency Race Condition Bonus Test
npm test

# 2. Run All E2E Integration Tests (Sales, Inventory, Isolation, Idempotency)
npm run test:e2e -- --runInBand
```

### Mandatory Scenarios Covered:
- **T-1 (Successful Sale)**: Complete sale creation, inventory deduction, payment `SUCCESS`, and `PAID` status.
- **T-2 (Failed Sale)**: Simulated payment decline, `FAILED` status, and automated compensation transaction restoring stock.
- **T-3 (Insufficient Inventory)**: Requesting quantity > available stock returns `422 Unprocessable Entity` before payment.
- **T-4 (Tenant Isolation)**: Cross-tenant store access is rejected with `403 Forbidden`; cross-tenant product lookups return `404 Not Found`.
- **T-5 (Idempotency)**: Retrying a sale with the same `Idempotency-Key` replays the saved response (`X-Idempotency-Replayed: true`) without double-charging or double-selling.
- **Bonus Concurrency Test**: Two POS terminals concurrently attempt to purchase 3 units each from a stock of 5 (`Promise.allSettled`). Exactly one succeeds, final stock is 2, and overselling is mathematically prevented.

---

## Documentation Links

- Detailed technical decisions, database schemas, and architectural trade-offs: [pos-api/README.md](pos-api/README.md)
- Complete design documents and checklists: [docs/](docs/)
- Postman Collection: [pos-api/postman/pos-api.postman_collection.json](pos-api/postman/pos-api.postman_collection.json)
