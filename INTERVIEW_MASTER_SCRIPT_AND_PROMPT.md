# Multi-Tenant POS & SaaS Platform — System Reference & Interview Mastery Guide

---

## PART 1: The Ready-to-Use Gemini Prompt

Copy and paste this exact prompt into Gemini whenever an interviewer asks you a question or when you want Gemini to practice mock interview rounds with you.

```text
You are an elite Senior Backend Engineering Interview Coach. 
I am preparing for a Senior Backend Engineer technical interview for a high-concurrency Multi-Tenant Point of Sale (POS) and SaaS Subscription platform built with NestJS, PostgreSQL (TypeORM), Redis, and Docker.

Attached below is the full architectural reference document of my codebase.

YOUR TASK:
Whenever I give you an interview question (or if you ask me one), provide the EXACT spoken answer I should give to the interviewer.

OUTPUT REQUIREMENTS:
1. ORDER: Always provide the answer in this strict order:
   - FIRST: Spoken English Answer
   - SECOND: Spoken Hinglish Answer (Hindi + English natural technical blend)
2. TONE & STYLE: 
   - Must sound completely natural, confident, and conversational—exactly how a real senior engineer speaks in a tech interview or system design round.
   - Do NOT sound like an AI reading bullet points or reciting a textbook.
   - Use natural transitions (e.g., "So basically...", "The way we tackled this is...", "Under the hood...", "Let me walk you through the journey...").
   - Mention real architectural trade-offs, code components, and numbers from the attached document (e.g., SELECT FOR UPDATE, ascending ID sorting, SHA-256 idempotency hash, Two-Phase SAGA, 10 salt rounds bcrypt).

Here is the complete project reference document:
[PASTE PART 2 BELOW HERE]
```

---

## PART 2: Complete Project Reference Document

### 1. High-Level Elevator Pitch
"I engineered a production-grade, high-concurrency Multi-Tenant SaaS Point of Sale (POS) backend using NestJS 10, PostgreSQL, TypeORM, and Redis. The platform operates on a two-tier hierarchy: a global SaaS Platform Vendor tier (`SUPER_ADMIN`) that manages master subscription plans and onboards client companies, and a multi-tenant client tier (`OWNER`, `ADMIN`, `MANAGER`, `CASHIER`) that manages stores, catalog, inventory, and checkout. The system solves three core engineering challenges: zero inventory overselling using row-level pessimistic locking (`SELECT FOR UPDATE`) with ascending deadlock immunity, zero double-charges via a SHA-256 idempotency interceptor, and strict tenancy and subscription limit enforcement."

---

### 2. The 5 Roles (Single-Line Summary)
1. **`SUPER_ADMIN` (Level 5 — Platform Vendor Owner):** Controls the SaaS platform, creates reusable subscription plans, onboards client companies, and manages plan upgrades/renewals.
2. **`OWNER` (Level 4 — Client Company Director):** Owns the client merchant company, checks subscription status/limits (`GET /merchants/me`), creates store branches, and provisions staff.
3. **`ADMIN` (Level 3 — Operations Manager):** Manages daily business operations, creates stores and staff within subscription limits, and maintains the product catalog.
4. **`MANAGER` (Level 2 — Store Supervisor):** Manages an assigned physical store branch, adjusts stock inventory, and supervises cashiers.
5. **`CASHIER` (Level 1 — POS Terminal Operator):** Operates the POS billing terminal, rings up customer sales checkout, and prints receipts.

---

### 3. All 20 API Endpoints (Single-Line Summary)

#### A. Platform Super Admin & Subscriptions
1. `POST /api/v1/auth/super-admin/setup` — One-time bootstrap endpoint to create or initialize the master Software Vendor account.
2. `POST /api/v1/subscriptions/plans` — Super Admin creates a new reusable subscription plan template (pricing, store/user limits).
3. `GET /api/v1/subscriptions/plans` — Retrieves the catalog of all active subscription plans available on the platform.
4. `GET /api/v1/subscriptions/plans/:id` — Retrieves detailed terms and limits for a specific subscription plan by its ID.
5. `PATCH /api/v1/subscriptions/plans/:id` — Super Admin modifies an existing subscription plan's price, duration, or limits.
6. `POST /api/v1/subscriptions/assign` — Super Admin upgrades, downgrades, or renews an active subscription for a client company.

#### B. Authentication
7. `POST /api/v1/auth/login` — Authenticates any user (Super Admin, Owner, Admin, Manager, Cashier) and returns JWT access & refresh tokens.
8. `GET /api/v1/auth/me` — Inspects the currently logged-in user’s JWT token to return their role, user ID, and company ID.
9. `POST /api/v1/auth/refresh` — Exchanges an unexpired refresh token for a fresh 1-hour access token without re-entering passwords.

#### C. Client Company (Merchant)
10. `POST /api/v1/merchants` — Super Admin onboards a new client company, assigns a subscription plan, and creates their root Owner account.
11. `GET /api/v1/merchants` — Super Admin lists all onboarded client companies along with their store counts and subscription statuses.
12. `GET /api/v1/merchants/me` — Client Owner views their company profile, active subscription status, remaining days, and store/user limits.

#### D. Store Branches
13. `POST /api/v1/stores` — Owner/Admin creates a new store branch after verifying the company has not exceeded its subscription store limit.
14. `GET /api/v1/stores` — Lists all physical store branches belonging to the authenticated client company.
15. `GET /api/v1/stores/:storeId` — Retrieves detailed profile, address, and status for a specific store branch.

#### E. Staff & Users
16. `POST /api/v1/users` — Owner/Admin provisions a new Manager or Cashier after verifying the company has not exceeded its user limit.
17. `GET /api/v1/users` — Lists all employees and active staff accounts working for the authenticated company.
18. `GET /api/v1/users/:userId` — Retrieves account profile and role assignment for a specific staff member.

#### F. Products & Inventory
19. `POST /api/v1/products` — Owner/Admin creates a new item in the company's master product catalog (name, SKU, price in minor units).
20. `GET /api/v1/products` — Retrieves the company’s product catalog with fast Redis-cached responses.
21. `GET /api/v1/products/:productId` — Retrieves pricing, SKU, and description details for a single product.
22. `POST /api/v1/stores/:storeId/inventory` — Manager adds stock units for a specific product at a specific store branch.
23. `GET /api/v1/stores/:storeId/inventory/:productId` — Checks the current real-time stock balance of a product at a store branch.

#### G. Sales Checkout & Health
24. `POST /api/v1/stores/:storeId/sales` — Cashier processes customer checkout using pessimistic locking (`SELECT FOR UPDATE`) and idempotency to prevent overselling or double-charges.
25. `GET /api/v1/stores/:storeId/sales/:saleId` — Retrieves the completed receipt, line items, and payment invoice for a past sale.
26. `GET /api/v1/health` — Checks and returns live health status for the NestJS server, PostgreSQL database, and Redis cache.

---

### 4. Core Technical Architecture & Interview Deep-Dives

#### A. Concurrency & Zero Overselling (Pessimistic Locking)
- **The Problem:** In flash sales or busy retail counters, two cashiers simultaneously checkout the last unit of stock. Standard `UPDATE` leads to negative inventory.
- **The Solution:** We wrap checkout in an atomic transaction and call `lockAndFetchForUpdate()`. Under the hood, this issues SQL `SELECT ... FOR UPDATE`, placing a row-level lock on the PostgreSQL record.
- **Deadlock Immunity:** When buying multiple items (Product A and Product B), if Transaction 1 locks A then B, and Transaction 2 locks B then A, PostgreSQL hits a deadlock. We prevent this by sorting product IDs in ascending alphabetical order (`[...ids].sort()`) before acquiring locks. Every transaction acquires locks in the identical order, mathematically eliminating circular wait deadlocks.
- **Database Hard Guarantee:** `CHECK (quantity >= 0)` constraint is enforced directly on the `store_inventory` table.

#### B. Double-Charge Prevention (Idempotency Interceptor)
- The POS client generates a unique `Idempotency-Key` UUID header.
- The `IdempotencyInterceptor` computes a SHA-256 hash of `method + path + JSON body`.
- If a network timeout occurs and the POS terminal retries, the backend detects the key, validates the hash, and instantly replays the saved invoice response with `X-Idempotency-Replayed: true` without hitting the database or charging the card twice.

#### C. Two-Phase SAGA with Compensating Rollback
- **Phase 1 (<5ms):** Lock inventory row, decrement stock, generate receipt record, commit transaction. Row lock is released immediately.
- **Phase 2 (Payment Outside Lock):** Call payment gateway (`PaymentPort.charge()`). We NEVER hold an open database lock while waiting for a 3-second external bank API.
- **Compensation:** If the payment fails or times out, a compensating transaction executes `incrementBatch()`, restoring inventory to its original count and marking the sale `FAILED`.

#### D. Multi-Tenancy & Security
- Passwords hashed with `bcrypt` (10 salt rounds).
- Stateless signed JWT access tokens (1 hour) + refresh tokens (7 days).
- Custom `RolesGuard` enforces hierarchy: `SUPER_ADMIN (5) > OWNER (4) > ADMIN (3) > MANAGER (2) > CASHIER (1)`.
- `StoreAccessGuard` enforces store boundary for Managers and Cashiers.

---

## PART 3: Top 10 Spoken Answers (English & Hinglish)

---

### Q1: "Can you explain the roles in your system and how authorization works?"

#### English Spoken Answer:
"In our architecture, we designed a 5-tier Role-Based Access Control hierarchy. At the top is the `SUPER_ADMIN` at level 5—this is the SaaS platform creator who operates above the merchant boundary, manages master subscription plans, and onboards client companies. Below that is the client company hierarchy: `OWNER` at level 4, who is the company director; `ADMIN` at level 3, who manages operations across stores; `MANAGER` at level 2, who is scoped to a single store branch and handles inventory; and `CASHIER` at level 1, who operates the billing terminal and can only process sales.

Authorization is enforced via our custom NestJS `RolesGuard`. When a request comes in, the guard extracts the user's role from their signed JWT and verifies that their role level meets or exceeds the required level for the endpoint. Furthermore, for store-specific endpoints like checkout or inventory updates, our `StoreAccessGuard` checks whether the store belongs to the user's company, and for Managers and Cashiers, strictly validates that the route parameter matches their assigned `storeId`."

#### Hinglish Spoken Answer:
"Hamare system me humne 5-level ka strict Role-Based Access Control implement kiya hai. Sabse upar level 5 pe `SUPER_ADMIN` hota hai—ye software platform owner hai jo companies ko onboard karta hai aur master subscription plans manage karta hai. Uske baad client level pe: level 4 pe `OWNER` hota hai jo poori company ka director hai; level 3 pe `ADMIN` jo stores aur staff manage karta hai; level 2 pe `MANAGER` jo kisi ek particular store ka supervisor hai aur inventory sambhalta hai; aur level 1 pe `CASHIER` hota hai jo billing counter pe baith kar sirf sales punch karta hai.

Authorization humne NestJS ke `RolesGuard` se enforce kiya hai. Har request me JWT token decode hota hai aur role level check hota hai. Iske sath ek `StoreAccessGuard` bhi hai jo ye ensure karta hai ki Manager aur Cashier sirf apne assigned store ka data access kar sakein, kisi doosre store ya doosri company ka nahi."

---

### Q2: "How do you prevent inventory overselling when two cashiers checkout the last item at the exact same millisecond?"

#### English Spoken Answer:
"To guarantee zero inventory overselling, we implemented row-level pessimistic locking using PostgreSQL's `SELECT FOR UPDATE`. When a checkout request arrives at `POST /sales`, we wrap the entire inventory check and deduction inside an atomic database transaction. Instead of a normal find, we call our custom repository method `lockAndFetchForUpdate()`.

PostgreSQL places an exclusive lock on that specific inventory row. If Cashier A arrives first, Cashier B's transaction is blocked and queued by the database engine until Cashier A commits. Cashier A decrements the stock from 1 to 0 and commits, which immediately releases the lock. Cashier B's transaction then unblocks, reads the freshly updated quantity of 0, sees that insufficient stock is available, and throws a 422 Unprocessable Entity exception. As a defense-in-depth guarantee, the table also has a database-level `CHECK (quantity >= 0)` constraint, so inventory can physically never drop below zero."

#### Hinglish Spoken Answer:
"Zero overselling ensure karne ke liye humne PostgreSQL ka row-level pessimistic locking—yaani `SELECT FOR UPDATE` use kiya hai. Jab checkout request aati hai, to hum us store ke product inventory row ko ek atomic transaction me lock karte hain.

Man lijiye stock sirf 1 bacha hai aur do cashiers ne ek sath checkout dabaya. Jo cashier pehle hit karega, database engine us row pe exclusive lock laga dega aur doosre cashier ko queue me hold kar dega. Pehla cashier stock 1 se ghata kar 0 karega aur transaction commit kar dega. Jaise hi lock release hoga, doosra cashier read karega to use updated stock 0 milega, aur system turant 422 Unprocessable Entity error throw kar dega. Iske alawa humne database schema me `CHECK (quantity >= 0)` ka hard constraint bhi lagaya hai, jisse negative stock ka koi chance hi nahi banta."

---

### Q3: "How do you prevent database deadlocks when an order contains multiple products?"

#### English Spoken Answer:
"Deadlocks happen in concurrent systems when two transactions acquire locks on multiple shared resources in opposing sequences—for example, Transaction 1 locks Product A and waits for Product B, while Transaction 2 locks Product B and waits for Product A.

We prevent this cleanly and deterministically: before acquiring any database locks in `sales.service.ts`, we extract all product IDs in the cart and sort them in ascending alphabetical order using `[...productIds].sort()`. Because every single concurrent transaction in the system is forced to acquire locks in the exact same deterministic sequence—always locking smaller IDs before larger IDs—circular wait conditions are mathematically impossible. We completely eliminate deadlocks without requiring retry loops."

#### Hinglish Spoken Answer:
"Deadlock tab create hota hai jab do concurrent transactions alag-alag order me resources lock karte hain—jaise Tx 1 ne pehle Product A lock kiya fir B ke liye wait kar raha hai, aur Tx 2 ne pehle Product B lock kiya fir A ke liye wait kar raha hai. Dono ek doosre ka wait karte reh jaate hain.

Isko solve karne ke liye humne ek simple aur bulletproof rule implement kiya: lock lene se pehle hum cart ke saare product IDs ko ascending order me sort kar dete hain `[...productIds].sort()`. Ab chahe kitne bhi cashiers ek sath checkout karein, har transaction hamesha identical sequence me hi lock acquire karega—pehle chhota ID fir bada ID. Isse circular wait mathematically impossible ho jata hai aur system 100% deadlock-immune ban jata hai."

---

### Q4: "Why do you process external payments outside the database transaction?"

#### English Spoken Answer:
"This is a critical architectural decision based on the Two-Phase SAGA pattern. In high-throughput retail systems, external payment gateways like Stripe or Razorpay introduce network latency, often taking between 1 to 4 seconds to respond. If you make that HTTP call inside an active database transaction, that inventory row lock stays open for several seconds, freezing checkout for all other customers and rapidly exhausting database connection pool slots.

Instead, we split the flow into two decoupled phases:
In Phase 1, which takes less than 5 milliseconds, we acquire the lock, validate stock, decrement inventory, create the sale record, and immediately commit the transaction. The database lock is released right away.
In Phase 2, we execute the external payment call outside the database transaction. If the payment succeeds, we update the status to `PAID`. If the payment fails or times out, our compensating transaction immediately triggers `incrementBatch()`, restoring the reserved inventory back to the shelf and marking the sale `FAILED`. This delivers maximum concurrency without blocking the database."

#### Hinglish Spoken Answer:
"Ye humari architecture ka ek bahut important design decision hai. Third-party payment gateways jaise Razorpay ya Stripe network call me 2 se 4 second ka time lete hain. Agar hum payment API ko database transaction ke andar call karenge, to database ka row lock 3 second tak open rahega. Isse baaki saare cashiers block ho jayenge aur connection pool choke ho jayega.

Isliye humne Two-Phase SAGA pattern use kiya:
Phase 1 me hum sirf 5 millisecond ke andar stock validate karke decrement karte hain aur transaction turant commit kar dete hain—taaki lock foran release ho jaye.
Phase 2 me hum payment gateway ko database transaction ke bahar call karte hain. Agar payment pass hua to order `PAID` ho jata hai. Agar payment fail hua ya timeout aaya, to compensating transaction chalta hai jo `incrementBatch()` call karke stock wapas restore kar deta hai aur status `FAILED` mark kar deta hai. Isse database hamesha fast aur responsive rehta hai."

---

### Q5: "How does your Idempotency mechanism protect against network retries and double-charging?"

#### English Spoken Answer:
"In physical retail, poor Wi-Fi or card terminal timeouts often cause the POS frontend to retry a checkout request. Without idempotency, this results in double inventory deductions and charging the customer's card twice.

We built an `IdempotencyInterceptor` in NestJS. The POS client sends an `Idempotency-Key` header with a unique UUID. On receiving the request, our interceptor computes a SHA-256 cryptographic hash of the HTTP method, endpoint path, and request body payload. If the key has already been processed with the identical hash, we bypass database execution completely and instantly replay the previously stored response with an `X-Idempotency-Replayed: true` header. If the key exists but the payload was tampered with, we reject it with a 422 error. All idempotency keys have a 24-hour TTL and are cleaned up daily by a scheduled cron job."

#### Hinglish Spoken Answer:
"Dukaan ya retail store me aksar internet slow hota hai, to POS machine request retry kar deti hai. Agar idempotency na ho, to customer ke account se do baar paise kat jayenge aur stock do baar minus ho jayega.

Iske liye humne ek dedicated `IdempotencyInterceptor` banaya hai. Client request ke header me ek unique `Idempotency-Key` bhejta hai. Backend us key ke sath request body ka SHA-256 hash check karta hai. Agar wahi key dobara aati hai same payload ke sath, to backend bina kisi database lock ya payment call ke, pehle se saved receipt response wapas return kar deta hai with `X-Idempotency-Replayed: true` header. Customer ko wahi bill mil jata hai aur double-charge 100% prevent ho jata hai."

---

### Q6: "How do you enforce Multi-Tenancy and prevent one company from seeing another company's data?"

#### English Spoken Answer:
"Multi-tenancy is enforced through three distinct layers:
First, at the Authentication layer, when a user logs in, their JWT payload securely encodes their `sub` (userId), `merchantId`, and `storeId`.
Second, at the Route Guard layer, our `StoreAccessGuard` validates that any store accessed belongs strictly to the authenticated `merchantId`. For Managers and Cashiers, it also verifies that the route's `:storeId` matches their assigned store, returning a 403 Forbidden otherwise.
Third, at the Database layer, all repositories—Products, Inventory, Sales, and Users—automatically append `where: { merchantId }` to every query, completely isolating tenants at the SQL query level."

#### Hinglish Spoken Answer:
"Multi-tenancy humne 3 layers pe secure ki hai:
Pehli layer JWT token hai—har user ke token me uska `merchantId` aur `storeId` securely embedded rehta hai jise tamper nahi kiya ja sakta.
Doosri layer `StoreAccessGuard` hai—jab bhi koi API call hoti hai, guard verify karta hai ki requested store usi merchant ka hai ya nahi. Agar koi cashier kisi doosre store ya doosri company ki ID pass karega, to use turant 403 Forbidden mil jata hai.
Teesri layer Database repository hai—har database query me hamesha `where: { merchantId }` filter lagta hai, jisse koi bhi company doosri company ka data kabhi nahi dekh sakti."

---

### Q7: "Why do you store monetary values in BigInt minor units instead of decimals or floats?"

#### English Spoken Answer:
"Storing currency as floating-point numbers or decimals in code is an anti-pattern because of IEEE 754 precision issues—for example, in JavaScript or C++, `0.1 + 0.2` evaluates to `0.30000000000000004`. Over thousands of daily retail transactions, rounding errors compound into severe balance discrepancies.

To avoid this, we follow international financial standards: all prices, line totals, and payments are stored as integer minor units in PostgreSQL `bigint` columns (paise in INR, cents in USD). For example, ₹450.00 is stored as `45000`. All arithmetic operations are exact integer additions and multiplications, completely eliminating rounding inaccuracies."

#### Hinglish Spoken Answer:
"Money ko float ya double me store karna programming me sabse badi galti hoti hai kyunki IEEE 754 precision issue ki wajah se `0.1 + 0.2` ka result `0.30000000000000004` ban jata hai. Retail me hazaron transactions ke baad accounts me mismatch aane lagta hai.

Isliye hum financial industry standard follow karte hain: saare prices minor units (paise ya cents) me store hote hain `bigint` column me. Jaise agar kisi item ka price ₹450 hai, to database me `45000` store hoga. Isse saara calculation pure integer math me hota hai aur rounding errors ka sawal hi paida nahi hota."

---

### Q8: "How does your SaaS Subscription Management and Limit Enforcement work?"

#### English Spoken Answer:
"Our subscription system is decoupled into two tables: `subscription_plans`, which acts as the master catalog of reusable plan templates (defining `priceMinorUnits`, `durationMonths`, `maxStores`, and `maxUsers`), and `merchant_subscriptions`, which tracks the active client binding and expiration dates.

When a client Owner attempts to create a new store branch (`POST /stores`) or onboard a new staff member (`POST /users`), the respective service calls `SubscriptionsService.checkCanAddStore()` or `checkCanAddUser()`. The service verifies that the company has an `ACTIVE` subscription, calculates remaining days, compares the current count against `plan.maxStores` and `plan.maxUsers`, and throws a `403 Forbidden` if the limit has been reached. When a client upgrades their tier, the limits expand immediately."

#### Hinglish Spoken Answer:
"Humara subscription model master-client architecture pe based hai. Ek table hai `subscription_plans` jisme reusable plans hote hain jaise Starter (1 store, 3 staff), Growth (5 stores, 20 staff), aur Enterprise. Doosri table hai `merchant_subscriptions` jo track karti hai ki kis company ne kaun sa plan le rakha hai aur uski expiry kab hai.

Jab bhi client company ka Owner naya store create karne jata hai (`POST /stores`) ya naya cashier add karta hai (`POST /users`), backend automatically us company ka active plan check karta hai. Agar store count unke plan limit (`maxStores`) ko cross kar raha hai, to API turant `403 Forbidden` throw kar deti hai with message: 'Store limit reached for your subscription plan'. Jab Super Admin unka plan upgrade karta hai, to limits instantly expand ho jaati hain."

---

### Q9: "How does your Redis caching strategy work and how do you prevent stale data?"

#### English Spoken Answer:
"We use Redis as a high-speed read cache for our product catalog (`GET /products`) with a 5-minute TTL (300,000ms), scoped by merchant (`products:merchant:<merchantId>`).

To guarantee cache consistency and prevent stale data, we follow an active cache invalidation pattern. Whenever an Admin creates a new product, updates pricing, or soft-deletes an item in `products.service.ts`, we explicitly trigger `cacheManager.del()` on both the individual product key and the merchant's list key. The next read automatically fetches fresh data from PostgreSQL and repopulates Redis. We also cache store existence in `StoreAccessGuard` for 60 seconds to eliminate redundant database roundtrips on high-frequency POS calls."

#### Hinglish Spoken Answer:
"Humne Redis ko high-speed read cache ki tarah use kiya hai product catalog ke liye, jiska TTL 5 minutes hai scoped by merchant ID.

Stale data yaani purana data prevent karne ke liye humne active cache invalidation lagaya hai. Jab bhi Admin naya product add karega, price change karega, ya product delete karega, `ProductsService` turant Redis se us merchant ka cache key `del()` kar deta hai. Isse agla read request database se fresh data uthata hai aur Redis me update kar deta hai. Iske alawa humne store access verification ko bhi 60 seconds ke liye Redis me cache kiya hai taaki har billing transaction pe baar-baar database query na karni pade."

---

### Q10: "What is currently mocked or future roadmap in your architecture?"

#### English Spoken Answer:
"To keep our architecture modular and testable, we designed a Hexagonal Architecture port for payments (`PaymentPort`). In our current environment, we implemented a `MockPaymentProvider` that simulates configurable gateway latency and failure rates for automated testing. In production, this can be swapped with a Stripe or Razorpay adapter without altering any business logic.

On our roadmap: first, integrating a persistent message queue like BullMQ with Redis or Apache Kafka for asynchronous receipt emailing and real-time sales event streaming; second, adding a Redis token blacklist to support immediate revocation of JWTs upon explicit user logout; and third, implementing NestJS Throttler for IP-based edge rate-limiting against DDoS attacks."

#### Hinglish Spoken Answer:
"Humne code ko modular rakhne ke liye Hexagonal Architecture ka `PaymentPort` interface banaya hai. Abhi testing ke liye humne ek `MockPaymentProvider` use kiya hai jo 50ms latency simulate karta hai aur jisme failure rate configure ho sakta hai. Production me hum ise bina business logic chhede seedhe Stripe ya Razorpay adapter se replace kar sakte hain.

Future roadmap me teen cheezein hain: Pehla, BullMQ ya Kafka integrate karna asynchronous bill emailing aur analytics events ke liye; doosra, Redis token blacklist add karna taaki user ke logout dabate hi JWT token turant revoke ho sake; aur teesra, brute-force attacks se bachne ke liye NestJS Throttler rate limiting add karna."
