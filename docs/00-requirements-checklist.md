# Requirements Checklist — Swazei Tech POS Assignment

> Legend: `[ ]` = pending · `[/]` = in progress · `[x]` = done

---

## Business Scenarios

- [x] **BS-1** Multi-Tenant Isolation — users can only access data belonging to their authorized merchant/store; changing an ID in a request must not reach another tenant's data
- [x] **BS-2** Sale and Inventory — validate products/quantities; use server-side prices; check inventory; calculate total server-side; process payment; create sale + update inventory; all transactionally consistent
- [x] **BS-3** Concurrent Sales — prevent overselling when stock = 5 and two POS terminals each try to sell 3; concurrency + transaction strategy explained
- [x] **BS-4** Duplicate POS Requests — same sale must NOT be created twice on retry; idempotency strategy implemented and explained
- [x] **BS-5** Payment Abstraction — mock provider simulating SUCCESS and FAILED; sale/order logic not coupled to provider
- [x] **BS-6** Redis or Async Queue — implement Redis caching for a read-heavy operation OR async queue; approach explained

---

## Technical Requirements

- [x] NestJS + TypeScript
- [x] PostgreSQL (primary DB)
- [x] REST APIs
- [x] Jest tests
- [x] Git (meaningful commits)
- [x] Controller → Service → Repository separation
- [x] DTO validation (class-validator / class-transformer)
- [x] Authentication (JWT) and role-based authorization (RBAC guards)
- [x] PostgreSQL relationships, constraints (FK, UNIQUE, CHECK), and indexes
- [x] Database transactions (atomic multi-step operations)
- [x] Tenant and store-level data isolation enforced in repositories
- [x] Proper error handling (global exception filter, standard error format)
- [x] Maintainable code structure (NestJS modules)
- [x] Environment-based configuration (ConfigModule + validation)

---

## Jest Test Scenarios (Mandatory)

- [x] **T-1** Successful sale (payment SUCCESS path)
- [x] **T-2** Failed sale (payment FAILED path)
- [x] **T-3** Insufficient inventory — sale rejected before payment
- [x] **T-4** Cross-tenant access rejected (403/404)
- [x] **T-5** Duplicate request does NOT create a second sale (idempotency replay)
- [x] **T-BONUS** Concurrent inventory update — only one of two competing sales succeeds (bonus)

---

## README Sections

- [x] Setup and environment configuration
- [x] Database and schema decisions
- [x] Tenant isolation approach
- [x] Transaction and concurrency strategy
- [x] Idempotency approach
- [x] Redis or queue implementation
- [x] Important trade-offs and assumptions

---

## Submission Deliverables

- [x] Source code (inside `pos-api/`)
- [x] Database migrations (`pos-api/src/database/migrations/`)
- [x] Seed and sample data (`pos-api/src/database/seeds/`)
- [x] Jest tests (`*.spec.ts` unit + `test/*.e2e-spec.ts`)
- [x] README (`pos-api/README.md`)
- [x] `.env.example` (`pos-api/.env.example`)
- [x] Postman collection (`pos-api/postman/`)
- [x] No secrets committed to the repo

---

## Design Documents (Phase 1)

- [x] `docs/01-architecture.md`
- [x] `docs/02-database-design.md`
- [x] `docs/03-tenant-isolation.md`
- [x] `docs/04-sale-flow-and-transactions.md`
- [x] `docs/05-concurrency-strategy.md`
- [x] `docs/06-idempotency.md`
- [x] `docs/07-payment-abstraction.md`
- [x] `docs/08-redis-or-queue.md`
- [x] `docs/09-api-design.md`
- [x] `docs/10-testing-plan.md`
- [x] `docs/11-implementation-plan.md`
