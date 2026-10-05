# Guest-First Cafe Ordering Platform
A web-based F&B ordering and operations platform designed around a **guest-first ordering experience**.
Customers can browse the menu, customize products, place Dine In or Take Away orders, pay, and track their orders **without creating an account or installing a mobile application**.
The platform also provides operational tools for Staff and centralized management capabilities for Admin.

---

## 1. Core Features

### Guest
- Guest ordering without an account.
- Public outlet menu.
- QR-based table context for Dine In.
- Dine In / Take Away ordering.
- Product customization.
- Guest cart.
- Cash and Online payment.
- Order tracking.
- Queue information and approximate wait time.
- Tracking access without customer login.

### Staff
- Staff authentication.
- Outlet-scoped access.
- Staff-assisted Guest Ordering.
- Active order dashboard.
- Cash payment confirmation.
- Order preparation workflow.
- Order completion.
- Eligible cancellation/refund handling.
- Exception Queue.

### Admin
- Admin authentication.
- Multi-outlet management.
- Table and QR management.
- Category and product management.
- Product option management.
- Basic product-level inventory.
- Staff account and outlet assignment management.
- Cross-outlet Exception Queue.

---

## 2. Documentation
The project documentation is organized by responsibility so that each document has a clear purpose.

| Document | Purpose |
|---|---|
| [PRD](docs/PRD.md) | Product goals, users, functional requirements, MVP scope, acceptance criteria, and future scope |
| [Business Rules](docs/BUSINESS_RULES.md) | Detailed business rules for ordering, payment, inventory, queue, expiration, and exceptions |
| [Data Model](docs/DATA_MODEL.md) | Core entities, relationships, important fields, historical transaction data, and data constraints |
| [Architecture](docs/ARCHITECTURE.md) | Technical architecture, API, security, testing, operations, infrastructure, and implementation decisions |
| [Design](docs/DESIGN.md) | UI/UX direction, visual language, components, responsive behavior, and interaction patterns |
| [Agent Guidelines](docs/AGENT.md) | Guidelines for coding agents covering assumptions, simplicity, surgical changes, and goal-driven execution |

### Documentation Reading Order
For a new contributor or coding agent:
```text
README.md
   ↓
PRD.md
   ↓
BUSINESS_RULES.md
   ↓
DATA_MODEL.md
   ↓
ARCHITECTURE.md
   ↓
DESIGN.md
   ↓
Implementation
```

`AGENT.md` should be consulted before making code changes.

---

## 3. Tech Stack

### Frontend
- Next.js
- TypeScript

### Backend
- NestJS
- TypeScript

### Database
- PostgreSQL
- Prisma

### Infrastructure
- Redis
- BullMQ

### Payment
- Midtrans Sandbox

### Supporting Technologies
- Zod-based request validation
- Email/notification processing
- Server-Sent Events (SSE) with polling fallback for guest tracking

Detailed technical decisions are documented in [ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 4. Project Structure
The repository is expected to follow a structure similar to:
```text
.
├── apps/
│   ├── web/
│   └── api/
├── docs/
│   ├── PRD.md
│   ├── BUSINESS_RULES.md
│   ├── DATA_MODEL.md
│   ├── ARCHITECTURE.md
│   ├── DESIGN.md
│   └── AGENT.md
├── packages/
├── .env.example
└── README.md
```

The exact source structure may evolve during implementation. Keep the repository structure aligned with `ARCHITECTURE.md`.

---

## 5. Getting Started

### Prerequisites
The development environment should provide:
- Node.js
- Package manager used by the repository
- PostgreSQL
- Redis

Payment and email-related development may also require the corresponding sandbox/test credentials.

### Installation
Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd <project-directory>
npm install
```

### Environment
Create the required environment files from the example configuration:
```bash
cp .env.example .env
```

Configure the required values for:
- Database connection.
- Redis connection.
- Authentication secrets.
- Midtrans Sandbox.
- Email/notification services where enabled.

Never commit real credentials or secrets to the repository.

### Development
Start the development environment using the project's configured scripts, for example:

```bash
npm dev
```

The exact commands should follow the repository's package configuration.

---

## 6. Development Workflow
Before implementing a feature:
1. Read the relevant requirements in `docs/PRD.md`.
2. Check applicable rules in `docs/BUSINESS_RULES.md`.
3. Check affected entities and relationships in `docs/DATA_MODEL.md`.
4. Check technical constraints and integration boundaries in `docs/ARCHITECTURE.md`.
5. Check UI/UX requirements in `docs/DESIGN.md`.
6. Follow the coding guidelines in `docs/AGENT.md`.

During implementation:
```text
Understand
   ↓
State assumptions / identify ambiguity
   ↓
Plan the smallest change
   ↓
Implement
   ↓
Test
   ↓
Verify against requirements
```

Keep changes focused on the requested feature. Avoid speculative abstractions or unrelated refactoring.

---

## 7. Environment Configuration
The project may require configuration for:
```text
Database
PostgreSQL connection

Redis
Redis connection

Authentication
Internal authentication secrets/configuration

Payment
Midtrans Sandbox configuration

Notifications
Email/notification configuration
```

Use `.env.example` as the source of required environment variable names.

Secrets must be provided through local environment configuration or the deployment secret-management mechanism, not committed to source control.

---

## 8. Implementation Plan
The project is implemented incrementally, with each milestone building on the previous one.

### Milestone 1 — Domain Foundation
**Status:** ✅ Complete
- Finalize requirements.
- Finalize main user flows.
- Define business rules.
- Define data model.
- Define architecture.
- Define design direction.

### Milestone 2 — Backend Foundation
**Status:** ✅ Complete
- NestJS project structure.
- Prisma + PostgreSQL.
- Core models.
- Request validation.
- Error handling.
- Configuration management.

### Milestone 3 — Catalog & Outlet
**Status:** ⬜ Not Started
- Outlet.
- Table.
- Category.
- Product.
- Product options.
- Product-level inventory.
- Table ordering URLs / QR assets.
- Public menu API.
- Outlet operating hours and table-number configuration.

### Milestone 4 — Guest Ordering
**Status:** ⬜ Not Started
- Next.js customer UI.
- QR context.
- Product customization.
- Client-side cart.
- Checkout.
- Server-side order validation.
- Order creation.
- Guest tracking credential.
- Email tracking-link delivery.
- Queue and tracking information display.

### Milestone 5 — Payment
**Status:** ⬜ Not Started
- Midtrans Sandbox.
- Cash payment flow and staff confirmation.
- Online payment creation.
- Webhook processing.
- Idempotency.
- Payment/order synchronization.
- Payment retry limit.
- Cancellation/refund behavior.

### Milestone 6 — Staff Operations
**Status:** ⬜ Not Started
- Staff authentication.
- RBAC.
- Outlet scoping.
- Staff-assisted Guest Ordering.
- Cash payment confirmation.
- Active order queue.
- Order state transitions.
- Cancellation/refund actions.
- Exception Queue.

### Milestone 7 — Admin
**Status:** ⬜ Not Started
- Admin authentication.
- Outlet management.
- Table management and QR assets.
- Catalog management.
- Inventory visibility/adjustment.
- Staff management.
- Cross-outlet Exception Queue.

### Milestone 8 — MVP Infrastructure & Async Processing
**Status:** ⬜ Not Started
- Redis.
- Rate limiting.
- BullMQ.
- Critical cleanup jobs.
- Notification/email jobs.
- SSE event delivery and polling fallback.
- Logging and observability.

### Milestone 9 — Testing & Deployment
**Status:** ⬜ Not Started
- Unit tests.
- Integration tests.
- End-to-end tests.
- Security review.
- Seed/demo data.
- Production deployment.

### Milestone 10 — Future Customer Account Upgrade

**Status:** ⏸ Deferred

Customer accounts remain outside the MVP and should be planned separately when the guest-first flow is stable.

---

## 9. MVP Status
The current project status is:
| Area | Status |
|---|---|
| Product Requirements | ✅ |
| Business Rules | ✅ |
| Data Model | ✅ |
| Architecture | ✅ |
| Design Direction | ✅ |
| Backend | 🟨 |
| Frontend | ⬜ |
| Payment Integration | ⬜ |
| Testing | ⬜ |
| Deployment | ⬜ |

Update this table as implementation progresses.

---

## 10. MVP Definition
The MVP should prove the complete value loop:
```text
QR / Outlet Menu
      ↓
Browse & Customize
      ↓
Cart
      ↓
Checkout
      ↓
Payment
      ↓
Order Tracking
      ↓
Staff Preparation
      ↓
Completion
```

A customer must be able to complete this journey without creating a customer account.
The MVP also includes authenticated Staff and Admin capabilities for operational and management functions.

---

## 11. Future Scope
Potential future capabilities include:
- Customer accounts.
- Guest-order claiming.
- Customer order history.
- Favorites and loyalty.
- Advanced inventory and warehouse workflows.
- Kitchen display integration.
- More granular staff roles.
- Promotions and discount codes.
- Advanced analytics and reporting.
- Multi-payment-provider abstraction.

Detailed future scope is maintained in [PRD.md](docs/PRD.md).

---

## 12. Project Principles
The project follows these development principles:
- **Think before coding:** surface assumptions, ambiguity, and trade-offs before implementation.
- **Simplicity first:** use the minimum solution that satisfies the requirement.
- **Surgical changes:** change only what is necessary and avoid unrelated refactoring.
- **Goal-driven execution:** define clear success criteria and verify the result.

For the full coding-agent guidelines, see [AGENT.md](docs/AGENT.md).

---

## 13. License
Add the project's chosen license here before public distribution.
