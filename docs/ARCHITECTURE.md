# Architecture — Guest-First Cafe Ordering Platform

**Document Status:** Draft v1.1 — Architecture Planning  
**Scope:** MVP  
**Source:** Technical decisions and implementation boundaries extracted from `AllForOne.md` / original PRD. Business rules are maintained in `BUSINESS_RULES.md`.  
**Document Boundary:** API, security, testing, and operations guidance are included in this document; they are not maintained as separate specification files.

---

# 1. Purpose
This document defines the technical architecture for the Guest-First Cafe Ordering Platform.
It describes how the product requirements and business rules are expected to be implemented across the web application, API, database, asynchronous processing, payment integration, guest tracking, security controls, testing, and supporting infrastructure.

This document should answer:
> **How will the system technically work?**

Product scope and user-facing requirements belong in `PRD.md`. Business states and business rules belong in `BUSINESS_RULES.md`. Entity and relationship definitions belong in `DATA_MODEL.md`. UI/UX decisions belong in `DESIGN.md`.

---

# 2. Architecture Principles
1. **Domain-oriented architecture** — backend modules are organized around business domains rather than only technical file types.
2. **Server authoritative** — PostgreSQL and backend business services remain the source of truth for core business state.
3. **Database durability first** — Redis is not a source of truth for orders, payments, or inventory.
4. **Separated responsibilities** — payment-provider integration, notification processing, inventory, ordering, and authentication have clear boundaries.
5. **Asynchronous where appropriate** — work that does not need to block the synchronous API path should use background jobs.
6. **Explicit state transitions** — order/payment state changes are validated by backend business logic.
7. **Idempotent external-event processing** — provider webhooks and retryable jobs must be safe to process more than once.
8. **Least privilege** — protected operations enforce identity and resource scope in the backend.
9. **Guest-first customer architecture** — the MVP does not require a customer-account subsystem.
10. **Progressive complexity** — infrastructure is introduced only for a defined MVP use case.
11. **Recoverability** — failed, expired, duplicated, and retried operations should have deterministic handling.
12. **Real-time without unnecessary bidirectional complexity** — guest tracking uses SSE with polling fallback rather than WebSocket.

---

# 3. System Overview

## 3.1 Logical Architecture
```text
                    ┌──────────────────────────┐
                    │       Guest Browser      │
                    │  Next.js Web Application │
                    └────────────┬─────────────┘
                                 │ HTTPS
                                 ▼
                    ┌─────────────────────────┐
                    │       NestJS API        │
                    │   Business/Application  │
                    │         Boundary        │
                    └──────┬─────┬─────┬──────┘
                           │     │     │
              ┌────────────┘     │     └──────────────┐
              ▼                  ▼                    ▼
     ┌────────────────┐  ┌───────────────┐   ┌───────────┐
     │  PostgreSQL    │  │     Redis     │   │ External  │
     │ Source of Truth│  │ Ephemeral /   │   │ Services  │
     │                │  │ Queue Support │   │           │
     └────────────────┘  └───────┬───────┘   └──────┬────┘
                                 │                  ├── Midtrans
                                 ▼                  └── Email Provider*
                           ┌───────────┐          
                           │  BullMQ   │
                           │  Workers  │
                           └───────────┘

* Email provider/delivery mechanism is not fixed by the current requirements.
```

## 3.2 Main Components
| Component | Responsibility |
|---|---|
| Next.js | Customer-facing and protected web experiences; browser-side state and UI |
| NestJS | API, application services, validation pipeline, authorization, business workflows |
| PostgreSQL | Durable source of truth for core business entities and state |
| Prisma | Database access / ORM layer |
| Redis | Distributed rate limiting, BullMQ infrastructure, and event fan-out when required |
| BullMQ | Asynchronous background work |
| Midtrans Sandbox | Online payment processing for MVP |
| Email delivery | Asynchronous order/tracking/payment notifications; provider not fixed |

---

# 4. Application Boundaries

## 4.1 Frontend
The web application is implemented using **Next.js + TypeScript**.
The frontend is responsible for:
- Public outlet/menu experience.
- QR-derived outlet/table context presentation.
- Product browsing and customization.
- Client-side guest cart.
- Checkout UI.
- Payment UI integration where applicable.
- Guest order tracking page.
- Staff dashboard UI.
- Admin dashboard UI.
- Display of customer-facing order/payment state.
- SSE connection management with polling fallback for tracking.

The frontend is **not authoritative** for:
- Final price.
- Final order total.
- Product availability.
- Payment confirmation.
- Order state transitions.
- Inventory state.
- Staff/admin authorization.

## 4.2 Backend
The backend is implemented using **NestJS** and is the primary business API/application-service boundary.

The backend is responsible for:
- Request validation.
- Authorization and outlet scoping.
- Business-rule enforcement.
- Order creation.
- Payment state processing.
- Inventory reservation/consumption/release workflows.
- Queue assignment.
- Guest tracking authorization.
- Background-job dispatching.
- Webhook processing.
- Exception handling.
- Audit/event persistence.

## 4.3 Database
**PostgreSQL** is the durable source of truth for core business entities.
Core business state must not depend on Redis being available.
**Prisma** is used as the database access layer / ORM.
The detailed entity structure, relationships, constraints, and conceptual schema belong in `DATA_MODEL.md`.

## 4.4 API Boundary
The NestJS API is the application boundary through which browser clients and external integrations interact with backend business workflows.

Conceptually:
```text
Web Client / External Provider
            ↓
        HTTP API
            ↓
     Validation Layer
            ↓
   Authorization (protected)
            ↓
      Application Service
            ↓
     Domain / Data Access
            ↓
 PostgreSQL / External Provider
```

Business rules are enforced behind the API boundary rather than being trusted from browser state.

---

# 5. Backend Domain / Module Structure
NestJS should be organized around business domains.
```text
src/
├── auth/
├── users/
├── outlets/
├── tables/
├── catalog/
│   ├── categories/
│   ├── products/
│   └── options/
├── orders/
├── payments/
├── webhooks/
├── inventory/
├── exceptions/
├── notifications/
└── common/
```

## 5.1 Domain Responsibilities

### `auth/`
Responsible for protected Staff/Admin authentication mechanisms.

### `users/`
Responsible for internal authenticated actors used by Staff/Admin workflows.

### `outlets/`
Responsible for outlet configuration and outlet-level context.

### `tables/`
Responsible for physical table administration and stable public ordering/QR assets.

### `catalog/`
Responsible for categories, products, product options/modifiers, and related catalog validation.

### `orders/`
Responsible for Guest Order creation, order lifecycle, queue entry, guest order access, and order-level workflows.

### `payments/`
Responsible for payment abstraction and payment state processing.

Provider-specific implementation should remain isolated behind the payment integration boundary where practical.

### `webhooks/`
Responsible for provider webhook entry points and provider-event handling boundaries.

### `inventory/`
Responsible for product-level inventory, reservation, consumption, and release workflows.

### `exceptions/`
Responsible for operational exceptions represented by `OrderException` and the Exception Queue.

### `notifications/`
Responsible for asynchronous notification/email dispatch.

### `common/`
Shared infrastructure and cross-cutting utilities that do not belong to a single business domain.

## 5.2 Customer Account Boundary
There is intentionally **no customer-account module in MVP**.
Guest ordering remains the core customer workflow. A future customer/member domain may be introduced later without changing the core ordering flow.

---

# 6. Request Processing and API Architecture

## 6.1 Request Processing Pipeline

All client-supplied data crossing the API boundary must be validated.

The planned validation flow is:
```text
Client Request
     ↓
Zod Schema Validation
     ↓
Business Validation
     ↓
Authorization (where protected)
     ↓
Application Service
     ↓
Database / External Integration
```

The current requirements specify **Zod schemas integrated with NestJS through `StandardSchemaValidationPipe`** as the planned validation approach.

Validation must cover at least:
- Required fields.
- Types.
- String lengths.
- Email format.
- Enum values.
- Numeric limits.
- Product/option relationships.
- Order quantities.
- Outlet context relationships.
- Dine-in table-number constraints.
- Business-specific constraints.

Validation does not replace authorization or business-rule validation.
Exact DTO/schema organization remains an implementation decision.

## 6.2 API Surface
The API is organized conceptually by domain and access scope.

### Public / Guest
```text
/outlets
/categories
/products
/orders
/orders/track
/orders/track/events (SSE concept)
```

Expected capabilities include:
- Public outlet/menu access.
- Guest order creation.
- Guest tracking with the required guest credential.
- Guest tracking event stream.

### Staff
```text
/staff/orders
/staff/orders/:id/payment
/staff/orders/:id/status
/staff/exceptions
```

Expected capabilities include:
- Assigned-outlet order operations.
- Cash payment confirmation.
- Eligible cancellation/refund actions.
- Exception Queue access and resolution.

### Admin
```text
/admin/outlets
/admin/tables
/admin/categories
/admin/products
/admin/product-options
/admin/inventory
/admin/staff
/admin/exceptions
```

Expected capabilities include:
- Outlet/table management.
- Catalog management.
- Inventory management.
- Staff management.
- Cross-outlet Exception Queue visibility.

### Webhooks
```text
/webhooks/midtrans
```

Provider webhook endpoints are external integration boundaries and must not rely on browser-originated payment state.

> The endpoint names above are a **conceptual API structure**, not a finalized contract. Exact endpoint naming, resource structure, HTTP semantics, pagination/filtering conventions, and REST conventions remain implementation decisions.

## 6.3 API Conventions
The API should use:
- Consistent request validation.
- Consistent, machine-readable errors.
- Safe client-facing error messages.
- No exposure of sensitive internal implementation details.
- Backend enforcement of authorization and business rules.

The exact success/error response schema is not fixed by the current source and should be finalized during implementation.

## 6.4 API Access Boundaries
The API must distinguish between:
```text
PUBLIC / GUEST
STAFF
ADMIN
EXTERNAL PROVIDER WEBHOOK
```

Guest access is narrow and order-scoped. Staff access is outlet-scoped. Admin access is platform-level according to the current MVP role model.

---

# 7. Authentication, Authorization, and Access Architecture

## 7.1 Public / Guest Boundary
The following functions do not require customer authentication:
- Public outlet menu.
- Public product browsing.
- Guest cart usage.
- Guest checkout.
- Guest order creation.
- Guest order tracking with a valid guest tracking credential.
- Staff-assisted ordering through the same public Guest Ordering Flow.

## 7.2 Protected Boundary
Authentication is required for:
- Staff dashboard and operational actions.
- Admin dashboard and management actions.

Initial internal roles are:
```text
STAFF
ADMIN
```

Backend authorization must verify both identity and resource/role access rather than relying on frontend route restrictions.

## 7.3 Staff Outlet Scoping
A Staff user may operate only within the outlet(s) assigned to that user.
The backend must perform the outlet-scope check for protected business actions.

## 7.4 RBAC Boundary
Conceptually:
```text
GUEST
  ✓ public menu
  ✓ create guest order
  ✓ authorized tracking
  ✕ staff dashboard
  ✕ admin dashboard

STAFF
  ✓ assigned outlet operations
  ✓ cash confirmation
  ✓ eligible order actions
  ✓ assigned-outlet exceptions
  ✕ platform administration

ADMIN
  ✓ outlet/table/catalog/inventory/staff management
  ✓ cross-outlet exception visibility
```

More granular permissions may be introduced later if requirements demand them.

---

# 8. Guest Order Access Architecture

## 8.1 Purpose
A guest must be able to access exactly one order without creating a customer account.

The guest tracking credential is an authorization credential for one order; the order identifier alone is not an authorization mechanism.

## 8.2 Credential Model

Conceptual model:

```text
GuestOrderAccess
├── id
├── orderId
├── tokenHash
├── expiresAt
├── createdAt
├── lastAccessedAt
└── revokedAt
```

The raw token does not need to be persisted in plaintext.

## 8.3 Token Flow
```text
Create Order
     ↓
Generate cryptographically random secret
     ↓
Store token hash
     ↓
Return raw token once to client
     ↓
Tracking URL
```

The business rules for token validity, expiration, and guest isolation are maintained in `BUSINESS_RULES.md`.

## 8.4 Guest Isolation
A valid guest tracking credential may expose only the associated order and customer-facing information required for tracking.

It must not grant access to:
- Other orders.
- Staff functions.
- Admin functions.
- Credentials.
- Payment secrets.
- Internal operational metadata.

---

# 9. Guest Cart Architecture

## 9.1 MVP Decision

Use a **client-side guest cart** as the default MVP architecture.

Possible browser storage:

```text
Browser State
+
localStorage (where appropriate)
```

The cart is temporary and is not the authoritative transaction.

## 9.2 Checkout Revalidation
At checkout, the server reconstructs/revalidates the transaction from submitted cart contents.

The server must not trust client-provided:
- Product price.
- Subtotal.
- Total.
- Product name.
- Option price.
- Availability state.
- Quantity without validation.

The checkout path revalidates:
- Product IDs.
- Product status.
- Option selections.
- Prices.
- Availability.
- Quantities.
- Outlet context.

## 9.3 Future Alternative
A server-side cart/session may be introduced later for:
- Cross-device persistence.
- Persistent carts.
- Account-linked carts.
- More complex cart synchronization.

Redis is not the source of truth for the MVP cart.

---

# 10. Order Processing Architecture

## 10.1 Core Flow
```text
Guest Checkout
      ↓
Order Creation
      ↓
PENDING
      ↓
Payment Confirmation
      ↓
PAID + NEW
      ↓
Operational Processing
      ↓
PREPARING
      ↓
READY
      ↓
COMPLETED
```

The exact business state rules are defined in `BUSINESS_RULES.md`.

## 10.2 Payment as Operational Gate
The backend is the authority for determining whether an order is eligible for operational processing.

A payment-confirmed order may enter the operational workflow; an unpaid order must remain outside active preparation.

## 10.3 Same Order Domain for Staff Assistance
Staff-assisted ordering uses the same public Guest Ordering Flow.
No separate staff order type or order-source subsystem is needed for MVP.

## 10.4 Order State Processing Boundary
Order-state changes should occur through controlled backend business operations rather than direct client mutation.

This includes:
- Payment confirmation.
- Preparation transitions.
- Completion.
- Cancellation.
- Exception-related actions.

---

# 11. Payment Integration Architecture

## 11.1 Integration Boundary
Payment-provider-specific code should be isolated behind the payment integration boundary.

Conceptually:
```text
Order Service
     ↓
Payment Application Service
     ↓
Payment Provider Adapter / Integration Boundary
     ↓
Midtrans Sandbox
```

The specific adapter class/interface naming is an implementation decision.

## 11.2 Payment Creation
The backend creates an online payment request only after a valid order has been established.

The payment amount is derived from the server-validated order total.

## 11.3 Webhook Processing
Conceptual flow:
```text
Midtrans
   ↓
Webhook Endpoint
   ↓
Verify / Authenticate Provider Notification
   ↓
Identify Related Payment / Order
   ↓
Validate Event
   ↓
Apply Business Transition
   ↓
Persist Result
   ↓
Trigger Required Side Effects
```

Webhook handling must be idempotent.

Duplicate provider notifications must not result in duplicate payments, duplicate order transitions, or duplicate downstream side effects.

## 11.4 Client Result vs Server Truth
The browser may display the payment provider's reported result, but the frontend does not independently mark the order permanently paid.

Server-side provider confirmation is authoritative for online payment state.

## 11.5 Payment Retry Boundary
An online retry creates a new `PaymentAttempt` for the same `Order` rather than creating a new order.

The business rules for maximum attempts and reservation TTL are defined in `BUSINESS_RULES.md`.

## 11.6 Payment Failure Boundary
Provider failure, expired payment, or unavailable provider conditions must not allow the browser to invent a successful payment state.

Payment-state changes should flow through the backend payment integration boundary.

---

# 12. Inventory Architecture

## 12.1 MVP Model
Inventory is product-level for MVP.

Conceptually:
```text
InventoryItem
├── productId
├── quantity
├── reservedQuantity
└── lowStockThreshold
```

Ingredient/BOM and warehouse-level inventory are outside MVP.

## 12.2 Reservation Workflow
The selected MVP inventory model is temporary reservation at order creation:
```text
Create Order
     ↓
Reserve Stock
     ↓
PENDING
     ↓
If Payment Confirmed → Consume Reservation
If Reservation Expires / Cancelled → Release Reservation
```

The exact reservation TTL and business treatment are defined in `BUSINESS_RULES.md`.

## 12.3 Consistency Boundary
The inventory workflow must preserve consistency between available quantity and reserved quantity.

Conceptually:
```text
availableQuantity = quantity - reservedQuantity
```

Inventory changes that affect business truth must be performed through protected database operations.

## 12.4 Payment / Inventory Failure

If payment is successfully confirmed but inventory consumption unexpectedly fails:

- Payment remains `PAID`.
- The order is not falsely represented as unpaid.
- The inconsistency is surfaced as an operational exception.
- The exception is handled through the Exception Queue.

This is an operational consistency failure, not a payment failure.

---

# 13. Concurrency and Transaction Architecture

Certain business operations require transactional protection because multiple actors or asynchronous processes can target the same order or inventory simultaneously.

## 13.1 Operations Requiring Transactional Protection
At minimum:
- Queue number assignment.
- Cash payment confirmation.
- Online payment confirmation.
- Inventory reservation.
- Inventory consumption.
- Inventory reservation release.
- Expired-order auto-cancellation.
- Confirmation near/after reservation expiry.

## 13.2 Reservation Expiry Guard

Confirmation and expiry handling must verify current order state and reservation validity before applying state changes.

Conceptually:
```text
Acquire Protected Order State
        ↓
Check Order Status
        ↓
Check Reservation Expiry
        ↓
If PENDING + Valid → Normal Confirmation
If CANCELLED / Expired → Do Not Reactivate
```

The exact database locking mechanism and transaction implementation are implementation decisions.

## 13.3 Duplicate Business Effects
Concurrent/repeated requests must not cause duplicate business effects.

Examples:
- Two staff requests confirming the same cash payment.
- Duplicate provider webhooks.
- Multiple executions of an expired-order cleanup job.
- Repeated order-state transition requests.

Idempotency and transactional guards should therefore be applied at the business-service boundary rather than relying only on frontend behavior.

---

# 14. Queue Architecture

## 14.1 Queue Assignment
Queue number is assigned when a paid order enters the operational queue.

The queue number is scoped by:
```text
Outlet
+
Operational Day
```

The business definition of operational day and queue reset is maintained in `BUSINESS_RULES.md`.

## 14.2 Queue Counter
The outlet maintains queue state needed to assign sequential queue numbers.

Queue assignment must be atomic so concurrent paid orders cannot receive duplicate queue numbers.

The architecture therefore requires a transactional counter update rather than calculating the next value from `MAX(queueNumber) + 1`.

## 14.3 Orders Ahead
`Orders Ahead` is a derived tracking value, not an independent source of truth.

It is calculated from current eligible orders within the same operational-day queue.

## 14.4 Estimated Wait
`Estimated Wait` is an informational derived value using the configured MVP approximation.

It does not need to become a separate authoritative persistence model in MVP.

---

# 15. Real-Time Guest Tracking Architecture

## 15.1 Primary Transport: SSE
Guest tracking uses **Server-Sent Events (SSE)** as the primary real-time update mechanism.

Reason:
- Tracking updates are one-directional from server to browser.
- The guest does not need a bidirectional persistent channel for this feature.
- SSE is therefore preferred over WebSocket for the MVP tracking use case.

## 15.2 SSE Boundary

Conceptually:
```text
Order / Payment / Queue State Change
                 ↓
          Event Publication
                 ↓
          SSE Event Stream
                 ↓
          Guest Tracking Page
```

The SSE endpoint is scoped to the guest tracking credential.

A valid guest credential can receive events only for its associated order.

## 15.3 Events
Relevant guest tracking events include:
- Payment confirmation.
- Order status change.
- Queue-position change.

## 15.4 Polling Fallback
If SSE is unavailable or the connection drops, the frontend falls back to periodic polling, for example every **10–15 seconds**.

The polling fallback keeps tracking functional without requiring a persistent connection.

## 15.5 Multi-Instance Scaling
For a single backend instance, Redis pub/sub is not required solely for SSE delivery.

If multiple backend instances are deployed, Redis pub/sub may be used for event fan-out so that an event generated by one instance reaches the instance serving a guest connection on another instance.

---

# 16. Redis Architecture
Redis is an infrastructure dependency for defined MVP use cases, not a business-data source of truth.

## 16.1 MVP Uses
Redis is primarily used for:
1. Distributed rate limiting.
2. BullMQ infrastructure.
3. Real-time event fan-out when required for multi-instance SSE delivery.

## 16.2 Explicit Non-Uses
Redis is not required to:
- Store authoritative orders.
- Store authoritative payment state.
- Store authoritative inventory state.
- Act as the source of truth for the MVP cart.
- Provide menu/catalog caching in the initial MVP.

## 16.3 Failure Behavior
If Redis becomes unavailable:
- PostgreSQL remains authoritative for core business state.
- Non-critical Redis usage should have a graceful fallback where practical.
- Queue/event/rate-limiting behavior should fail in a controlled manner rather than silently corrupt business state.

Exact Redis keys, data structures, rate-limit algorithm, TTLs, and connection configuration are implementation decisions.

---

# 17. Background Job Architecture

## 17.1 Job System

**BullMQ** is required for MVP asynchronous work that should not depend on the synchronous API request path.

```text
NestJS API
    ↓
BullMQ Producer
    ↓
Redis
    ↓
BullMQ Worker
    ↓
Job Handler
```

## 17.2 MVP Queues
The current planned queue split is:

```text
critical-queue
├── cleanup.expired-pending-orders
└── cleanup.expired-guest-access

notification-queue
├── email.order-confirmation
├── email.tracking-link
├── email.payment-update
└── notification.staff-order
```

## 17.3 Critical Cleanup
`cleanup.expired-pending-orders` is a required MVP job.

Its purpose is to prevent expired unpaid orders from remaining indefinitely in `PENDING` and to release any remaining inventory reservation according to the business rules.

## 17.4 Notification Jobs
Notifications are asynchronous so email/notification failure does not roll back or corrupt the core order/payment transaction.

## 17.5 Job Reliability
Background jobs should support:

- Limited retries.
- Backoff.
- Failure visibility.
- Idempotent handlers.
- Explicit handling of repeatedly failed jobs.

A retried job must not duplicate a business side effect.

---

# 18. Auto-Cancellation Architecture

Expired `PENDING` orders are handled asynchronously by the critical cleanup queue.

Conceptually:

```text
Scheduler / Worker Trigger
        ↓
Find Expired PENDING Orders
        ↓
Protected Transaction
        ↓
Re-check Current State
        ↓
Release Remaining Reservation
        ↓
Order → CANCELLED
        ↓
Record Required Audit/Event
```

The cleanup operation must be safe to retry.

The worker must re-check the current order state before changing it because payment confirmation or manual cancellation may have happened after the job selected the order.

The exact scheduler implementation and execution frequency follow the business requirements and implementation constraints.

---

# 19. Notifications Architecture

Notifications are not part of the core order/payment transaction.

The intended pattern is:

```text
Core Business Transaction
        ↓
Persist Business State
        ↓
Enqueue Notification Job
        ↓
Notification Worker
        ↓
Email / Notification Provider
```

Examples:

- Order confirmation.
- Guest tracking link.
- Payment update.
- Staff order notification.

The current source does not fix a particular email delivery provider, so that decision remains open for implementation.

---

# 20. Error Handling and Failure Architecture

## 20.1 Error Categories

The architecture distinguishes between:

```text
Validation Error
Business Rule Error
Authorization Error
External Provider Error
Infrastructure/System Error
Operational Exception
```

The distinction helps the API return appropriate, safe client-facing behavior while keeping operational issues visible internally.

## 20.2 API Error Requirements
API errors should be:
- Consistent.
- Machine-readable.
- Safe to expose to clients.
- Free from sensitive internal implementation details.

Customer-facing failure categories include:
- Outlet unavailable.
- Invalid table context.
- Product unavailable.
- Invalid option.
- Cart changed/unavailable.
- Invalid checkout data.
- Payment failed.
- Payment expired.
- Payment pending.
- Invalid tracking credential.
- Expired tracking credential.
- Temporary system unavailability.

**Implemented error format:** `{ "error": { "code": string, "message": string, "details"?: unknown } }`.
Validation errors use `code = VALIDATION_FAILED` with HTTP 400 and `details[]` of `{ path, message }`.
Unexpected errors return `INTERNAL_ERROR` (HTTP 500) with a generic message; details are logged server-side only.

## 20.3 Payment Provider Failure
The payment provider may be unavailable or return a failed/expired result.
The order remains governed by the normal payment and reservation rules; the frontend must not invent a successful payment state.

## 20.4 Webhook Duplication
Repeated webhook delivery must be idempotent.

## 20.5 Background Worker Failure
A failed worker job may retry according to queue policy.
Notification failure must not roll back the core business transaction.
Critical cleanup jobs require visibility and retry handling.

## 20.6 Redis Failure
PostgreSQL remains the source of truth.
Non-critical Redis-backed behavior should degrade gracefully where practical.

## 20.7 SSE Failure
The guest tracking page falls back to polling.

## 20.8 Transaction Rollback
If a protected database transaction fails, business state must remain consistent and the operation must be retried or surfaced as an error/exception according to its workflow.

---

# 21. Observability and Audit Architecture

## 21.1 Operational Logging
Development/staging should support at least:
- Structured application logs.
- Error logging.
- Request correlation/request IDs.
- Payment webhook logs with sensitive values excluded.
- Background job logs.

## 21.2 Audit Events
Business/security-significant actions should create audit records where required.

Examples:
- Order created.
- Cash payment confirmed.
- Online payment state changes / webhook processing.
- Order status changes.
- Order cancellation.
- Refund actions/results where applicable.
- Manual inventory adjustments.
- Admin changes to outlets, tables, categories, products, options, and staff assignments.
- Exception raised/resolved.

Normal browsing, scrolling, menu viewing, and ordinary cart interaction are not treated as audit events.

## 21.3 Audit vs Operational Exception
These are separate concepts:

```text
AuditLog
= historical record of what happened

OrderException
= actionable record of what still needs resolution
```

The Exception Queue therefore does not rely on audit logs alone.
The exact audit schema and retention policy are defined across the data model and implementation work.

---

# 22. Security Architecture
Security is a cross-cutting architectural concern and is intentionally included here rather than maintained as a separate security specification file.

## 22.1 Password Storage
Use a password hashing algorithm suitable for password storage, with **Argon2id preferred for the initial implementation** for Staff/Admin credentials.

## 22.2 Authentication
Staff/Admin access credentials should be short-lived where appropriate.
A refresh mechanism may be used and should support a revocation strategy.
The exact token transport, storage, rotation, expiration, and revocation implementation remain implementation decisions.

## 22.3 Authorization
Every protected business action must validate both:
1. Identity.
2. Resource/role authorization.

Authorization must be enforced in the backend through guards, policies, resource checks, or equivalent mechanisms rather than relying solely on frontend route restrictions.

## 22.4 Guest Credential Security
Guest tracking tokens must:
- Be high entropy and unpredictable.
- Be represented securely in storage.
- Be scoped to one order.
- Be time-bounded according to the business rules.
- Be revocable where required.

The raw tracking token should not be stored in plaintext.

## 22.5 Input Security
Validate and normalize API inputs at the API boundary.
Validation is not a replacement for authorization or business-rule validation.

## 22.6 Rate Limiting
Apply rate limits to abuse-prone endpoints, especially:
- Staff/Admin login.
- Guest checkout/order creation.
- Payment initialization.
- Public order tracking.
- Other sensitive public endpoints.
- Webhook endpoints as appropriate to provider/infrastructure requirements.

Redis may support distributed rate limiting when multiple backend instances are present.

## 22.7 Secrets
Payment credentials, authentication secrets, database credentials, and other sensitive values must be stored in environment/deployment secret management and must not be committed to source control.

## 22.8 Sensitive Logging
Logs must avoid exposing:
- Passwords.
- Access tokens.
- Refresh tokens.
- Raw guest tracking tokens.
- Payment secrets.
- Unnecessary sensitive personal information.

---

# 23. External Integration Boundaries

## 23.1 Midtrans
```text
orders/payments domain
        ↓
payment integration boundary
        ↓
Midtrans Sandbox
        ↓
Webhook back to NestJS
```

Midtrans-specific behavior should not leak unnecessarily into unrelated domain modules.

## 23.2 Email Provider
The current requirements define asynchronous email delivery but do not fix a specific provider.
Therefore:
```text
notification domain
        ↓
email abstraction
        ↓
provider-specific implementation
```

The concrete provider can be selected during implementation.

---

# 24. Data Source of Truth Architecture
The architecture follows this ownership model:
| Concern | Authoritative Source |
|---|---|
| Outlet | PostgreSQL |
| Catalog | PostgreSQL |
| Product availability | PostgreSQL / business logic |
| Order | PostgreSQL |
| Payment state | PostgreSQL + verified provider event |
| Inventory | PostgreSQL |
| Guest tracking authorization | PostgreSQL-backed credential record |
| Queue assignment state | PostgreSQL |
| Redis state | Ephemeral infrastructure only |
| Notification delivery | Background job infrastructure plus relevant persisted business records where applicable |

A client-side value, cache, or Redis record must not silently override authoritative business state.

---

# 25. Operations and Deployment Architecture

## 25.1 Runtime Components
The MVP runtime consists conceptually of:

```text
Web Application
    └── Next.js

API Application
    └── NestJS

Database
    └── PostgreSQL

Infrastructure Services
    ├── Redis
    └── BullMQ Worker(s)

External Services
    ├── Midtrans Sandbox
    └── Email Provider*

* provider not fixed by current requirements
```

## 25.2 Operational Responsibilities
Operational deployment must account for the availability and failure characteristics of:
- PostgreSQL.
- Redis.
- BullMQ workers.
- Midtrans.
- Email delivery.
- SSE connections.
Core order/payment data must remain durable even when asynchronous infrastructure or notification delivery is unavailable.

## 25.3 Background Worker Operations
Workers must be observable enough to identify:
- Failed jobs.
- Repeated retries.
- Stalled/blocked work where applicable.
- Critical cleanup failures.
- Notification delivery failures.

## 25.4 Logging and Monitoring Expectations
At minimum, operational environments should support the observability requirements defined in Section 21:
- Structured logs.
- Error visibility.
- Request correlation.
- Webhook processing visibility.
- Background job visibility.
Exact monitoring tools, alert thresholds, retention, and hosting configuration remain implementation decisions.

## 25.5 Environment Configuration
Sensitive and environment-specific values should be supplied through deployment/environment configuration rather than source control.
Examples include:
- Database connection configuration.
- Redis connection configuration.
- Midtrans credentials.
- Authentication secrets.
- Email-provider credentials.
The exact secret-management mechanism is an implementation decision.

---

# 26. Testing Strategy
Testing is included in this architecture document because it verifies the behavior of the product and the technical boundaries described here.

## 26.1 Unit Tests
Unit tests should cover critical domain/application logic, including:
- Order state transition rules.
- Payment state handling.
- Inventory reservation/release logic.
- Queue calculations.
- Guest access validation.
- Authorization/outlet-scope checks.
- Retry-limit logic.
- Exception handling rules.

## 26.2 Integration Tests
Integration tests should verify boundaries between application services and infrastructure, including:
- PostgreSQL persistence.
- Prisma data access.
- Inventory transactions.
- Order/payment state changes.
- Guest tracking persistence.
- Webhook processing.
- BullMQ job handlers.
- Redis-backed infrastructure behavior where applicable.

## 26.3 API / E2E Tests
Important scenarios include:
- Guest dine-in order.
- Guest take-away order.
- Payment success.
- Payment failure.
- Expired payment.
- Duplicate webhook.
- Invalid tracking token.
- Expired tracking token.
- Queue-number assignment after payment confirmation.
- Dynamic orders-ahead calculation.
- Estimated-wait display.
- SSE tracking updates and polling fallback.
- Staff unauthorized outlet access.
- Admin-only endpoints.
- Inactive product/order attempt.
- Invalid table-number range.
- Automatic operational-day queue reset.
- Payment retry rejection after reservation expiry or retry limit.
- Race-condition handling near/after reservation expiry.
- Cash confirmation attempted after automatic order cancellation.
- Valid guest table numbers that do not correspond to an active physical table record.

## 26.4 Frontend Tests
Frontend tests should cover critical user interactions such as:
- Product customization.
- Cart updates.
- Checkout validation.
- Payment-state UI.
- Queue-information rendering.
- Tracking-state rendering.
- SSE connection fallback behavior.

## 26.5 Reliability Test Expectations
Repeated or concurrent operations should be tested for duplicate side effects, especially:
- Duplicate payment webhooks.
- Repeated cash confirmation.
- Concurrent inventory changes.
- Repeated order-state transitions.
- Repeated background-job execution.

---

# 27. Scalability Considerations
The initial architecture supports a simple single-instance MVP deployment while identifying the main multi-instance boundary.

## 27.1 Single Backend Instance
For a single backend instance:
- SSE can be served without Redis pub/sub solely for connection fan-out.
- Redis remains needed for defined MVP infrastructure uses such as BullMQ and distributed rate limiting.

## 27.2 Multiple Backend Instances
When multiple API instances are introduced:

```text
             ┌── API Instance A ── Guest SSE connections
Redis Pub/Sub│
             └── API Instance B ── Guest SSE connections
```

Redis pub/sub may distribute order/payment/queue events between instances.
The business source of truth remains PostgreSQL regardless of deployment topology.

## 27.3 Future Scaling Areas
Potential future work includes:
- More advanced caching where traffic justifies it.
- Stronger workload-aware wait-time estimation.
- More sophisticated inventory management.
- More granular staff concurrency/shift handling.
These are not required for the MVP.

---

# 28. Architecture Decision Summary
| Decision | MVP Position |
|---|---|
| Web frontend | Next.js + TypeScript |
| Business API | NestJS |
| Database | PostgreSQL |
| ORM | Prisma |
| Cache / ephemeral infrastructure | Redis where justified |
| Background jobs | BullMQ |
| Online payment | Midtrans Sandbox |
| Guest cart | Client-side |
| Guest order authentication | Temporary order-scoped credential |
| Real-time tracking | SSE |
| Real-time fallback | Polling every ~10–15 seconds |
| Inventory model | Product-level temporary reservation |
| Order/payment truth | PostgreSQL + verified provider confirmation |
| API validation | Zod + NestJS `StandardSchemaValidationPipe` (planned approach) |
| Customer account module | Not included in MVP |
| Staff-assisted ordering | Same Guest Ordering Flow |
| Multi-instance SSE fan-out | Redis pub/sub when required |
| Security specification | Included in this document |
| Testing strategy | Included in this document |
| Operations guidance | Included in this document |

---

# 29. Open Implementation Decisions
The following details are intentionally not fixed by the current source and should be decided during implementation/design work:
- Exact Next.js application routing structure.
- Exact NestJS file/folder conventions inside each domain.
- Exact service/repository layering.
- Exact Prisma schema and indexes.
- Exact API endpoint names and HTTP semantics.
- Exact API error response schema.
- Exact authentication token transport/storage strategy.
- Refresh-token rotation and revocation implementation.
- Exact guest-token encoding and hashing implementation.
- Exact RBAC guard/policy implementation.
- Exact Redis key/data-structure strategy.
- Rate-limit algorithm and per-endpoint numeric limits.
- BullMQ retry/backoff numeric configuration.
- Scheduler mechanism and exact execution frequency implementation.
- Exact SSE implementation and event serialization.
- Email provider and template infrastructure.
- Deployment topology and hosting configuration.
- Environment/secret-management mechanism.
- Detailed monitoring and alerting configuration.
- Audit-log physical schema and retention configuration.
- Exact API success/error response contracts.

---


