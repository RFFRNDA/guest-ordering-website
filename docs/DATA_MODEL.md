# DATA_MODEL — Guest-First Cafe Ordering Platform

**Document Status:** Draft v1.0 — Data Model Planning  
**Scope:** MVP  
**Source:** Conceptual data model and guest-order data strategy.  
**Note:** This document defines the conceptual/domain data model. It is **not yet the final Prisma schema**.

---

# 1. Purpose
This document defines the data model used to represent the core business domains of the Guest-First Cafe Ordering Platform.
It should answer:
> **What data does the system need to store, and how are those data related?**

The document focuses on entities, relationships, important fields, constraints, and historical-data requirements.
Implementation details such as exact Prisma syntax, naming conventions, index definitions, migration strategy, and database-specific optimization may be refined during implementation.

---

# 2. Data Modeling Principles
1. **PostgreSQL is the durable source of truth** for core business entities.
2. **Orders are transaction records** and should retain the information required to represent the transaction as it occurred.
3. **Guest ordering does not require a customer account.**
4. **Customer identity is optional for the order domain** so a future customer-account feature can be introduced without changing the core order model.
5. **Order/payment state remains explicit** rather than collapsing different business concepts into a single field.
6. **Historical transaction values are snapshotted** where product/catalog changes could otherwise alter the meaning of an existing order.
7. **Derived tracking values are not independent sources of truth** unless a future requirement establishes a reason to persist them.
8. **Physical table identity and guest-entered table context are intentionally separate concepts.**

---

# 3. Domain Overview
The MVP can be grouped into the following domains:
```text
Identity
├── User
└── RefreshToken

Outlet
├── Outlet
├── CafeTable
└── StaffOutletAssignment

Catalog
├── Category
├── Product
├── ProductOptionGroup
└── ProductOption

Ordering
├── Order
├── OrderItem
├── OrderItemOption
├── GuestOrderAccess
└── OrderException

Payment
├── Payment
├── PaymentAttempt
└── PaymentEvent / WebhookEvent

Inventory
└── InventoryItem

Audit / Operations
└── AuditLog

Future / Optional
├── Role / Permission
├── InventoryTransaction
├── Notification
└── Customer Account
```

---

# 4. Internal Identity

## 4.1 User
`User` represents authenticated internal actors in the MVP.
Primary users:
- Staff
- Admin

Conceptual role values:
```text
STAFF
ADMIN
```

A customer is **not** required to have a `User` record in the MVP.

### Conceptual Data
```text
User
├── id
├── name / identity fields
├── authentication credential fields
├── role
└── timestamps
```

---

## 4.2 RefreshToken
`RefreshToken` supports the internal authentication flow for Staff/Admin where a refresh mechanism is used.
```text
RefreshToken
├── id
├── userId
├── token / token representation
├── expiration
├── revocation state
└── timestamps
```

The exact token-storage and rotation model remains an implementation decision.

---

## 4.3 Role / Permission
Role/permission may remain a simple role field for MVP:
```text
STAFF
ADMIN
```

A separated `Role` / `Permission` model is optional and may be introduced if authorization becomes more granular.
Customer role is intentionally not required for MVP.

---

# 5. Outlet Domain

## 5.1 Outlet
`Outlet` represents a physical café/F&B location.
Conceptual fields:

```text
Outlet
├── id
├── name
├── slug / code
├── address
├── contact information
├── operating status
├── openTime
├── closeTime
├── timezone
├── tableNumberLimit
├── queueCounter
├── currentOperationalDay
└── timestamps
```

### Important Rules
- Each outlet can have its own operating hours.
- `timezone` is used to interpret operating-hour and operational-day rules.
- `tableNumberLimit` defines the accepted guest dine-in table number range.
- `queueCounter` and `currentOperationalDay` support sequential queue assignment.
- Queue numbering belongs to an outlet and its operational day.

The exact schema for the operational-day identifier is an implementation decision.

---

## 5.2 CafeTable
`CafeTable` represents a physical table record maintained by the outlet.
Conceptual fields:
```text
CafeTable
├── id
├── outletId
├── tableNumber
├── isActive
└── timestamps
```

### Important Distinction
`CafeTable` represents the **physical-table management record**.
The `Order.tableNumber` represents the **guest-provided delivery context**.
Therefore:
```text
Order.tableNumber
        ≠
CafeTable.id
```

and `Order.tableNumber` does not need to be a foreign key to `CafeTable`.
A guest may submit a valid table number within the outlet's configured range even if the corresponding physical `CafeTable` record is inactive or unavailable.

---

## 5.3 StaffOutletAssignment
`StaffOutletAssignment` defines which outlet(s) an internal Staff user may operate.
Conceptual fields:
```text
StaffOutletAssignment
├── id
├── userId
├── outletId
└── timestamps
```

A Staff user may be assigned to multiple outlets.

Future shift/duty scheduling may add fields such as:
```text
shiftDate
isOnDuty
```

without changing the core authorization relationship.

---

# 6. Catalog Domain

## 6.1 Category
`Category` groups products for public menu presentation.

Conceptual fields:
```text
Category
├── id
├── outletId
├── name
├── isActive
├── displayOrder
└── timestamps
```
Inactive categories should not be presented for new guest ordering.

---

## 6.2 Product
`Product` represents a sellable menu item.
Conceptual fields:
```text
Product
├── id
├── outletId
├── categoryId
├── name
├── description
├── image
├── price
├── isActive
├── availability
└── timestamps
```

### Important Rules
- A Product belongs to one Outlet in MVP.
- A Product can belong to a Category.
- Product availability is checked during guest ordering.
- Final transaction pricing is validated server-side.
- Every Product must have exactly one `InventoryItem` record in MVP.

---

## 6.3 ProductOptionGroup
`ProductOptionGroup` represents a configurable customization group.
Examples:
```text
Size
Add-ons
Sugar Level
Ice Level
```

Conceptual fields:
```text
ProductOptionGroup
├── id
├── productId
├── name
├── isRequired
├── selectionType
├── minSelections
├── maxSelections
└── timestamps
```

The exact enum names for `selectionType` are an implementation decision.

---

## 6.4 ProductOption
`ProductOption` represents a selectable value within an option group.
Examples:
```text
Size
├── Small
├── Medium
└── Large

Add-ons
├── Extra Shot
├── Cheese
└── Syrup
```

Conceptual fields:
```text
ProductOption
├── id
├── groupId
├── name
├── priceAdjustment
├── isAvailable
└── timestamps
```

The selected option and its transaction-time price adjustment are also stored through `OrderItemOption`.

---

# 7. Ordering Domain

## 7.1 Order
`Order` is the central transaction entity.
All customer orders in MVP are **Guest Orders**, regardless of whether the customer completes the flow independently or receives staff assistance.

Conceptual fields:
```text
Order
├── id
├── outletId
├── customerId                nullable / future
├── customerName
├── customerEmail
├── orderType
├── tableNumber               nullable for take-away
├── status
├── reservationExpiresAt
├── queueNumber               nullable until queue entry
├── queueOperationalDay       nullable until queue entry
├── timestamps
└── cancellation / lifecycle fields as required
```

### Order Type
MVP:
```text
DINE_IN
TAKE_AWAY
```

### Order Status
MVP:
```text
PENDING
NEW
PREPARING
READY
COMPLETED
CANCELLED
```

### Important Rules
- `customerId` is nullable because a Guest Order does not require a customer account.
- `customerName` and `customerEmail` are stored on the Order as transaction-time customer information.
- `tableNumber` is nullable for Take Away.
- `tableNumber` is not a foreign key to `CafeTable`.
- `queueNumber` is nullable until the order enters the operational queue.
- `queueOperationalDay` identifies the operational-day context in which the queue number was assigned.
- `reservationExpiresAt` belongs to the Order, not to an individual payment attempt.
- No `orderSource`, staff creator, or staff-assistance field is required in MVP.

---

## 7.2 OrderItem
`OrderItem` represents one product line inside an Order.
Conceptual fields:

```text
OrderItem
├── id
├── orderId
├── productId / product reference
├── productNameSnapshot
├── unitPrice
├── quantity
├── notes
└── timestamps
```

### Historical Snapshot Requirement
At minimum, an OrderItem should retain:
- Product reference/identifier.
- `productNameSnapshot`.
- `unitPrice`.
- `quantity`.

This prevents later catalog changes from altering the historical meaning of an existing transaction.

---

## 7.3 OrderItemOption
`OrderItemOption` represents a selected product customization at transaction time.
Conceptual fields:
```text
OrderItemOption
├── id
├── orderItemId
├── option reference
├── optionNameSnapshot
├── priceAdjustment
└── timestamps
```

The transaction should retain enough information to reconstruct what customization was selected and what price adjustment applied at the time of ordering.

---

## 7.4 GuestOrderAccess
`GuestOrderAccess` provides temporary authorization for an unauthenticated guest to access one order's tracking page.
Conceptual fields:

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

### Important Rules
- The raw guest tracking token does not need to be stored in plaintext.
- One access credential is scoped to its associated Order.
- Possession of an Order ID alone is not sufficient authorization.
- Guest access must not provide Staff/Admin capabilities.
- Access expiration and revocation are part of the guest-access lifecycle.

---

## 7.5 OrderException
`OrderException` represents an unresolved operational issue requiring manual handling.
Conceptual fields:
```text
OrderException
├── id
├── orderId
├── type
├── raisedAt
├── resolvedAt
├── resolvedByUserId
├── resolutionNote
├── resolutionAction
└── timestamps
```

MVP exception types defined by the current requirements:
```text
INVENTORY_CONSUMPTION_FAILED
STOCK_SHORTFALL_ON_CONFIRM
LATE_PAYMENT_ON_CANCELLED_ORDER
```

### Resolution
`resolutionAction` is required when an exception is marked resolved.
Examples:
```text
REFUNDED
CASH_RETURNED
ITEM_SUBSTITUTED
CUSTOMER_CONTACTED
MANUALLY_RECONCILED
```

`OrderException` is distinct from `AuditLog`:
```text
AuditLog
→ records that an event/action happened.

OrderException
→ records that an operational problem still requires resolution.
```

---

# 8. Payment Domain

## 8.1 Payment
`Payment` represents the payment state associated with an Order.

Conceptual relationship:
```text
Order
└── Payment
```

MVP payment methods:
```text
CASH
ONLINE
```

MVP payment states:
```text
UNPAID
PENDING
PAID
FAILED
EXPIRED
REFUNDED
```

The exact one-to-one / one-to-many physical schema between Order and Payment may be finalized during implementation. The current requirement explicitly expects multiple `PaymentAttempt` records for online retries.

---

## 8.2 PaymentAttempt
`PaymentAttempt` represents an individual online payment attempt for the same Order.

Conceptual fields:
```text
PaymentAttempt
├── id
├── orderId
├── payment reference
├── provider reference
├── status
├── amount
├── createdAt
└── timestamps
```

Business rule:
```text
One Order
└── multiple PaymentAttempt records
```

A terminal online attempt with state `FAILED` or `EXPIRED` counts toward the MVP retry limit.
The exact provider-specific fields should remain isolated to the payment integration design.

---

## 8.3 PaymentEvent / WebhookEvent
`PaymentEvent` / `WebhookEvent` represents a received external payment event for traceability and idempotent processing.

Conceptual fields:
```text
PaymentEvent / WebhookEvent
├── id
├── provider
├── providerEventReference
├── related payment/order reference
├── event type
├── receivedAt
├── processing status
├── processedAt
└── event payload / metadata as appropriate
```
The exact payload-storage strategy and provider-specific structure are implementation decisions.

---

# 9. Inventory Domain

## 9.1 InventoryItem
`InventoryItem` represents the MVP product-level stock record.

Conceptual fields:
```text
InventoryItem
├── id
├── productId
├── quantity
├── reservedQuantity
├── lowStockThreshold
└── timestamps
```

### Important Relationship
In MVP:
```text
Product 1 ─── 1 InventoryItem
```
Every Product must have exactly one InventoryItem.
There is no "untracked" or "unlimited stock" Product category in MVP.

### Inventory Values
Conceptually:
```text
availableQuantity = quantity - reservedQuantity

0 <= reservedQuantity <= quantity
```

These are business invariants. The transaction/concurrency mechanism used to preserve them belongs in `ARCHITECTURE.md`.

---

## 9.2 InventoryTransaction
`InventoryTransaction` is **future scope**.
It may later be introduced for:
- Stock movement history.
- Adjustments.
- Waste.
- More detailed inventory reporting.
- Ingredient/warehouse workflows.

It is not required as a full inventory transaction model for the MVP.

---

# 10. Notification Domain

## 10.1 Notification
`Notification` is currently **future/optional** as a persisted domain entity.
MVP notifications may be handled through asynchronous jobs without requiring a full persistent Notification model.
Potential future uses:
```text
Notification
├── order confirmation
├── payment update
├── tracking link
└── staff notification
```

The current requirements fix the need for asynchronous notification work but do not fully define a persistent Notification entity.

---

# 11. Audit Domain

## 11.1 AuditLog
`AuditLog` records business/security-significant actions.
Conceptual fields:
```text
AuditLog
├── id
├── actorType
├── actorUserId (nullable)
├── action
├── entityType
├── entityId
├── metadata
├── requestId (optional)
└── createdAt
```

Examples of audited actions:
- Order created.
- Cash payment confirmed.
- Online payment state change.
- Payment webhook processing.
- Order status changes.
- Order cancellation.
- Refund actions/results.
- Manual inventory adjustment.
- Outlet/catalog/staff configuration changes.
- Exception raised.
- Exception resolved.
Normal browsing, scrolling, menu viewing, and cart interaction are not required to be audit events.

---

# 12. Guest Customer Data Strategy

## 12.1 Guest Order
A Guest Order stores transaction-time customer information directly on the Order:
```text
Order
├── customerId
├── customerName
└── customerEmail
```

For MVP:
```text
customerId = NULL
```

The order remains self-contained even when no customer account exists.

---

## 12.2 Why Customer Information Is Stored on Order
Order data represents a historical transaction.
The transaction should retain the customer name/email used for that order so future customer-profile changes do not silently rewrite historical transaction information.

Conceptually:
```text
Customer Account
        │
        │ optional
        ▼
      Order
```

The Order remains valid whether or not the customer later has an account.

---

## 12.3 Future Member Order
A future customer-account feature may use:
```text
Member Order
├── customerId = USER_xxx
├── customerName
└── customerEmail
```

while a Guest Order remains:
```text
Guest Order
├── customerId = NULL
├── customerName
└── customerEmail
```

The detailed customer-account model is outside MVP scope.

---

# 13. Relationship Map

The current MVP relationship model is:
```text
User
├── StaffOutletAssignment
│   └── Outlet
│       ├── CafeTable
│       ├── Category
│       │   └── Product
│       │       ├── ProductOptionGroup
│       │       │   └── ProductOption
│       │       └── InventoryItem
│       └── Order
│           ├── OrderItem
│           │   └── OrderItemOption
│           ├── GuestOrderAccess
│           ├── OrderException
│           └── Payment
│               ├── PaymentAttempt
│               └── PaymentEvent / WebhookEvent
│
└── RefreshToken

AuditLog
└── references actor/entity context
```

---

# 14. Important Constraints

## 14.1 Guest Ordering
```text
Order.customerId = nullable
```
A customer account must not be required to create an Order.

---

## 14.2 Outlet Ownership
The following entities are outlet-scoped directly or through their parent relationship:
```text
CafeTable
Category
Product
Order
StaffOutletAssignment
```
A Staff user's access must be constrained using the relevant outlet assignment.

---

## 14.3 Product Ownership
In MVP:
```text
Product → one Outlet
```
A Product is not shared across multiple outlets through a global catalog relationship.

---

## 14.4 Inventory
Every Product must have exactly one InventoryItem.
```text
Product 1 ─── 1 InventoryItem
```

---

## 14.5 Table Context
```text
Order.tableNumber
```
is delivery context only.
It should not be modeled as a foreign key to `CafeTable`.

---

## 14.6 Queue
```text
Order.queueNumber
Order.queueOperationalDay
```
are nullable until the Order enters the operational queue.
Once assigned, the queue number remains a stable reference for that Order.
`Orders Ahead` and `Estimated Wait` are derived tracking values and are not independent authoritative fields in the MVP.

---

## 14.7 Historical Order Integrity
`OrderItem` and `OrderItemOption` must preserve the transaction-time values needed to keep the historical order readable even when catalog data changes later.
At minimum:
```text
OrderItem
├── product reference
├── productNameSnapshot
├── unitPrice
└── quantity

OrderItemOption
├── option reference
├── optionNameSnapshot
└── priceAdjustment
```

---

# 15. Data That Is Derived Rather Than Authoritative
The following values should be treated as derived tracking information:
```text
availableQuantity
ordersAhead
estimatedWaitMinutes
```

They should be calculated from authoritative business state rather than becoming competing sources of truth.
For example:
```text
availableQuantity
= quantity - reservedQuantity
```

and:
```text
ordersAhead
= current eligible orders ahead in the same operational-day queue
```
The exact query/calculation strategy belongs in implementation design.

---

# 16. Data Lifecycle Overview

## Order Creation
```text
Guest
  ↓
Order
  ├── OrderItem
  ├── OrderItemOption
  ├── GuestOrderAccess
  └── inventory reservation state
```

## Payment
```text
Order
  ↓
Payment
  ├── PaymentAttempt
  └── PaymentEvent / WebhookEvent
```

## Operational Processing
```text
Payment confirmed
      ↓
Order becomes operationally eligible
      ↓
queueNumber assigned
      ↓
PREPARING
      ↓
READY
      ↓
COMPLETED
```

## Exception
```text
Operational/payment inconsistency
      ↓
OrderException
      ↓
Staff/Admin resolution
      ↓
AuditLog
```
The exact transaction boundaries between these lifecycle steps belong in `ARCHITECTURE.md`.

---

# 17. Future Extension Points
The data model intentionally leaves room for future capabilities without making them part of MVP.

## 17.1 Customer Account
Potential future relationship:
```text
Order.customerId → User / Customer Account
```
This relationship should remain optional.

---

## 17.2 Advanced Inventory
Potential future entities:
```text
InventoryTransaction
Ingredient
BillOfMaterial
Warehouse
StockMovement
```
These are not required for MVP.

---

## 17.3 More Granular Authorization
A future version may replace or extend simple:
```text
STAFF
ADMIN
```

with a richer Role/Permission model.

---

## 17.4 Notification Entity
A future persistent Notification model may be added when the product requires notification history, user preferences, delivery tracking, or inbox-like behavior.

---

# 18. Open Data-Model Decisions
The following are intentionally not finalized in this document:
- Exact primary-key type and ID format.
- Exact Prisma model naming.
- Exact timestamp strategy.
- Exact enum naming.
- Exact authentication credential fields.
- Exact Payment-to-Order cardinality implementation.
- Exact provider-specific PaymentAttempt fields.
- Exact webhook payload storage strategy.
- Exact index definitions.
- Exact database constraints beyond the business invariants stated above.
- Migration sequencing.
- Data retention policy.
- Customer-account schema for future versions.
These decisions should be finalized during implementation without changing the business concepts defined here.
