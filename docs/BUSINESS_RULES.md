# Business Rules — Guest-First Cafe Ordering Platform

**Document Status:** Draft v1.0  
**Purpose:** Define the business rules that govern ordering, payment, inventory, queue, guest tracking, and operational handling for the MVP.

> This document defines **what the business/system must enforce**. Implementation details such as database locking, transaction strategy, endpoint design, token hashing, queue infrastructure, and background-job implementation are intentionally kept outside this document and will be defined in the relevant technical documents.

---

## 1. General Ordering Rules

### 1.1 Guest Ordering
- A customer may place an order without creating a customer account.
- Customer registration, customer login, and customer profile management are out of scope for the MVP ordering flow.
- All customer orders in the MVP are **Guest Orders**.
- A Guest Order may be created independently by the guest or with staff assistance.
- Staff assistance does not create a separate order type, order source, staff-created order type, or staff-assistance field.
- Guest order validity must not depend on the existence of a customer account.
- Every checkout creates a separate order. Multiple simultaneous orders may exist for the same table or browser.

### 1.2 Order Type
The MVP supports two order types:
- `DINE_IN`
- `TAKE_AWAY`

Rules:
- `DINE_IN` requires an outlet context and a guest-provided table number at checkout.
- `TAKE_AWAY` does not require a table number.
- A table number is treated as delivery context only. It does not represent ownership, reservation, or table locking.

### 1.3 Outlet Availability
- An outlet must be active to accept new orders.
- New orders may be created only during the outlet's configured operating hours.
- MVP operating-hour windows must not cross midnight.
- If an outlet is inactive or outside its configured operating hours, new order creation is not allowed.

### 1.4 Catalog Availability
- Inactive products and categories must not appear in the public ordering experience for new orders.
- Products or options that are unavailable cannot be newly ordered.
- Prices used for an order must be based on the current server-validated catalog data.

---

## 2. QR & Table Rules

### 2.1 Table QR Context
When a valid table QR is opened:
1. The outlet context is identified.
2. Dine-in is selected by default.
3. The scanned table number is prefilled.
4. The outlet menu is loaded in the identified outlet context.
5. The guest may edit the table number before order creation.
6. Changing the table number does not create a new order and does not change the outlet context.

Example:
```text
Customer scans Table 1 QR
        ↓
Dine In = selected
Table = 1 (prefilled)
        ↓
Customer moves to Table 14
        ↓
Checkout
Table = 14 (customer edits)
        ↓
Order uses 14 as delivery context
```

### 2.2 QR Is Context Only
The QR code is a convenience/context mechanism only.
It does **not**:
- Lock a physical table.
- Reserve a physical table.
- Track table occupancy.
- Permanently bind an order to the scanned physical table.

### 2.3 Table Number Rules
For dine-in orders, the guest may enter any positive integer within the outlet's configured table-number range:
```text
1 ≤ tableNumber ≤ outlet.tableNumberLimit
```

Rules:
- The table number must be within the configured range.
- The number does not need to match an existing `CafeTable` record.
- The number remains valid even if the corresponding physical table record is inactive, unavailable, damaged, or occupied.
- The table number is delivery context only and is not a security boundary.

### 2.4 QR Asset Responsibility
The platform is responsible for:
- Creating and maintaining the stable public ordering URL associated with a table.
- Rendering or providing a QR representation of that URL for administrative use.
- Allowing the QR asset to be viewed/downloaded where practical.

Physical printing, laminating, mounting, and replacement of QR codes are external operational activities.

---

## 3. Operational Day & Queue Rules

### 3.1 Operational Day
Each outlet may have configured:
- `openTime`
- `closeTime`
- `timezone`

The outlet's operational day is bounded by its configured operating hours and the **Close Outlet Day** event.

### 3.2 Close Outlet Day
When the configured close time is reached:
- The current operational day is closed.
- The queue numbering context for the next operational day starts again from `1`.
- A new operational-day identifier is established for subsequent queue assignments.
- Existing orders that are still in progress are not cancelled or completed solely because the operational day is closed.
- A carried-over order keeps its previously assigned queue number.
- Orders from the previous operational day are not compared against new queue numbers using queue-number arithmetic.

If an outlet has no configured operating hours, the automatic Close Outlet Day event does not occur; an authorized staff/admin user may use a manual Close Day action as a fallback.

### 3.3 Queue Assignment
- A queue number is assigned when a paid order becomes eligible for operational processing (`Order = NEW`).
- Queue numbers are sequential within an outlet's operational day.
- Queue numbers are shared across dine-in and take-away orders unless a future business rule introduces separate queues.
- Once assigned, a queue number remains stable for the lifetime of the order.

### 3.4 Orders Ahead
- `Orders Ahead` represents the current number of active paid orders ahead of the guest within the same operational-day queue context.
- `Orders Ahead` is dynamic and may decrease as orders are completed or otherwise leave the operational queue.
- `Orders Ahead` is not a fixed value stored in a confirmation email.

### 3.5 Estimated Wait
- MVP uses a configured default estimated wait of **10 minutes**.
- The estimated wait is informational and is not a guaranteed completion time.
- Advanced workload/history-based estimation is out of scope for the MVP.

---

## 4. Order Lifecycle Rules

### 4.1 Order Status
The MVP order statuses are:
```text
PENDING
NEW
PREPARING
READY
COMPLETED
CANCELLED
```

### 4.2 Payment Status
The MVP payment statuses are:
```text
UNPAID
PENDING
PAID
FAILED
EXPIRED
REFUNDED
```

### 4.3 Separate Order and Payment State
Order status and payment status are separate state dimensions.
Payment confirmation is the gate that allows an order to enter the operational workflow.
Normal flow:
```text
Create Guest Order
        ↓
Order = PENDING
        ↓
Payment confirmed
        ↓
Payment = PAID
Order = NEW
        ↓
PREPARING
        ↓
READY
        ↓
COMPLETED
```

### 4.4 Payment Gate
An order that has not been confirmed as paid must not enter active preparation.
The following transitions are invalid in the normal MVP workflow:
```text
PENDING/UNPAID  → PREPARING
PENDING/UNPAID  → READY
PENDING/UNPAID  → COMPLETED
READY           → PREPARING
COMPLETED       → PREPARING
```

### 4.5 Customer-Facing Status
The customer-facing tracking experience simplifies the internal operational state:
| Internal State | Customer-Facing State |
|---|---|
| `PENDING + UNPAID` | Payment Pending + payment instruction |
| `PENDING + PENDING` | Payment Pending + payment instruction |
| `NEW + PAID` | Preparing + Queue information |
| `PREPARING + PAID` | Preparing + Queue information |
| `READY + PAID` | Ready + Queue information |
| `COMPLETED + PAID` | Completed + Queue information |
| `CANCELLED + PAID` (exception) | Cancelled + payment exception |
| `CANCELLED` | Cancelled |

The exact customer-facing wording and visual treatment may be refined during UX implementation without changing the underlying business rules.

### 4.6 Preparing Simplification
`NEW` and `PREPARING` are intentionally represented to customers as **Preparing**.
This avoids implying a strict first-in-first-out kitchen completion sequence. Kitchen preparation time may differ between orders, so queue position is not presented as a guaranteed completion order.

---

## 5. Payment Rules

### 5.1 Supported Payment Methods
The MVP supports:
```text
CASH
ONLINE
```
- `CASH` is paid directly to the outlet cashier.
- `ONLINE` uses Midtrans Sandbox for the initial MVP implementation.
- QRIS is the primary recommended sandbox demonstration method.
- Credit Card may be enabled as an additional sandbox method for testing successful/failed scenarios.
- Other Midtrans payment methods are not required for MVP unless they provide specific testing value.

### 5.2 Cash Payment
Cash payment follows:
```text
Create Order
     ↓
Order = PENDING
Payment = UNPAID
     ↓
Customer pays cashier
     ↓
Staff confirms cash payment
     ↓
Payment = PAID
Order = NEW
```

Rules:
- A cash order remains pending/unpaid until authorized staff confirms receipt of cash.
- Cash confirmation is the authoritative business event for cash payment.
- Staff may confirm only an eligible pending order.
- A cash order uses a fixed **60-minute reservation window from order creation**.
- The cash reservation window does not reset.

### 5.3 Online Payment
Rules:
- An online payment request may be created only for a valid order.
- The payment amount must be based on the server-validated order total.
- A guest-facing client result does not by itself make the order paid.
- An online order becomes paid only after valid server-side confirmation of the provider payment event.

### 5.4 Payment Webhook Rules
- Provider payment events must be validated before affecting order/payment state.
- Repeated provider events must not produce duplicate business effects.
- A late successful payment confirmation must not silently reactivate an order that has already been cancelled because its reservation expired.

### 5.5 Online Payment Retry
A failed/expired online payment should normally create a new payment attempt for the **same order**, not a new order.
Rules:
- One order may have multiple online `PaymentAttempt` records.
- Maximum of **3 terminal failed/expired payment attempts** is allowed per order.
- Only a created payment attempt that reaches `FAILED` or `EXPIRED` counts toward the 3-attempt limit.
- A retry request rejected before a payment attempt is created does not consume a retry slot.
- After the third terminal failed/expired attempt, no further online payment attempt may be created for the order.
- Reaching the retry limit does not extend or reset the order's reservation window.

### 5.6 Reservation Window and Payment Retry
The reservation belongs to the order, not to an individual payment attempt.
For `ONLINE` orders:
- Reservation window = **30 minutes from order creation**.
- Retries do not reset, extend, or change the reservation expiry.
- A new retry is allowed only while the order remains pending and its reservation has not expired.

For `CASH` orders:
- Reservation window = **60 minutes from order creation**.
- There is no payment retry mechanism in the MVP.

### 5.7 Payment Expiration and Failure
- Failed or expired online payment attempts must not mark the order as paid.
- An order remains pending while payment is unresolved and the reservation window is still valid.
- When the reservation expires without valid payment confirmation, the order is cancelled according to the expiration rules.
- Reaching the online retry limit does not itself cancel the order; the existing reservation expiry or an explicit cancellation determines what happens next.

### 5.8 Cancellation and Refund
MVP policy:
- Unpaid order → `CANCELLED` without refund.
- Paid order before preparation → refund according to the payment method, then `CANCELLED`.
- Once preparation has started, ordinary cancellation is restricted unless an explicit exception is supported.
- Cash refunds are handled manually by staff.
- Online refunds use the payment provider's supported refund flow and applicable provider limitations.

---

## 6. Inventory Rules

### 6.1 MVP Inventory Model
MVP inventory is product-level and simplified.
Each product must have exactly one associated inventory record.
There is no untracked or unlimited-stock product category in the MVP.
When an admin creates a product, an initial stock quantity is required.

Conceptually:
```text
InventoryItem
├── productId
├── quantity
├── reservedQuantity
└── lowStockThreshold
```
Ingredient/BOM inventory and warehouse-level inventory are out of scope for the MVP.

### 6.2 Inventory Reservation Strategy
The selected MVP strategy is:
```text
Create Order
     ↓
Reserve stock
     ↓
Payment confirmed
     ↓
Consume reservation
```

If the order is cancelled or the reservation expires:
```text
Release remaining reservation
```

This prevents multiple guests from reserving stock that has already been temporarily reserved by another pending order.

### 6.3 Reservation Rules
- A `PENDING` order holds a temporary product-level reservation.
- `ONLINE` reservations last 30 minutes from order creation.
- `CASH` reservations last 60 minutes from order creation.
- The reservation window is fixed for the order.
- Failed/expired online payment attempts do not release the reservation while the order remains pending and the reservation is still valid.
- Successful payment consumes the reservation.
- Cancellation or reservation expiry releases any remaining reservation.

Conceptually:
```text
availableQuantity = quantity - reservedQuantity
```
The business rule is that reserved stock cannot be sold to another order until that reservation is consumed or released.

### 6.4 Inventory Consistency Exception
If payment is successfully confirmed but inventory consumption unexpectedly fails:
- Payment remains `PAID`.
- The order must not be represented as unpaid.
- The inconsistency must be flagged for operational resolution.
- The case is treated as an exceptional operational/system issue, not as a payment failure.
- No separate customer-facing payment state is required solely for this exception in the MVP.

---

## 7. Reservation Expiry, Auto-Cancellation & Exceptions

### 7.1 Auto-Cancellation of Expired Pending Orders
A `PENDING` order whose reservation window has expired and whose payment has not been confirmed is automatically cancelled.
Rules:
- The order transitions to `CANCELLED`.
- Any remaining inventory reservation is released.
- For `ONLINE`, the applicable local payment state may become `EXPIRED`.
- For `CASH`, payment remains `UNPAID`.
- The cancellation reason is `RESERVATION_EXPIRED`.
- The event is auditable as a system-generated action.
- No customer notification is required for this event in the MVP.

The expired order must not remain indefinitely as an untracked pending order.

### 7.2 Confirmation at or After Expiry
When a payment confirmation or cash confirmation occurs near or after reservation expiry:
- The current order state and reservation validity determine whether the confirmation is still eligible for the normal flow.
- A cancelled/expired order must not be automatically reactivated.
- A late online payment confirmation after cancellation is treated as an exceptional payment case and requires operational resolution.
- A staff attempt to confirm cash for an already-cancelled/expired order must not silently re-enter the normal order lifecycle.
- A cancelled order must not automatically transition back to `PENDING` or `NEW`.

### 7.3 Order Exceptions
The MVP uses an actionable exception concept for cases that require manual resolution.
At minimum, the following exception types are supported:
```text
INVENTORY_CONSUMPTION_FAILED
STOCK_SHORTFALL_ON_CONFIRM
LATE_PAYMENT_ON_CANCELLED_ORDER
```

Rules:
- An exception must be visible to the staff/admin role responsible for resolving it.
- An exception records when it was raised and the order it relates to.
- Staff/admin may resolve an exception with an explicit resolution action and, optionally, a resolution note.
- A resolution action is required when marking an exception as resolved.
- Resolving an exception does not silently change the order/payment state. Any such state change must be a separate explicit business action.
- Exceptions associated with operationally active orders may coexist with the normal active-order workflow.
- A cancelled order with `LATE_PAYMENT_ON_CANCELLED_ORDER` is handled through the Exception Queue rather than the normal active-orders queue.

Examples of resolution actions include:
```text
REFUNDED
CASH_RETURNED
ITEM_SUBSTITUTED
CUSTOMER_CONTACTED
MANUALLY_RECONCILED
```

---

## 8. Guest Tracking Rules

### 8.1 Guest Tracking Access
Because customers do not have accounts in the MVP:
- A guest receives a temporary order-tracking credential/URL after order creation.
- The credential provides access only to its associated order.
- Possession of an order number alone does not authorize access to the order.
- Tracking access must not expose unrelated orders, staff data, admin data, credentials, payment secrets, or unnecessary internal metadata.

### 8.2 Tracking Access Lifetime
- Normal guest tracking access is valid for up to **2 hours from order creation**.
- If the order is still active when the 2-hour window ends, access is extended until **1 hour after the order reaches `COMPLETED`**.
- Tracking access may be revoked when required.

### 8.3 Tracking Information
The guest tracking experience may show:
- Order number.
- Queue number when assigned.
- Current `Orders Ahead` value when meaningful.
- Estimated wait when meaningful.
- Order items.
- Total amount.
- Payment method and payment status.
- Customer-facing order status.
- Relevant timestamps.

### 8.4 Tracking Link Delivery
- The tracking URL is displayed immediately after order creation.
- The tracking URL is also sent to the customer email in the MVP.
- The tracking link is the intended recovery mechanism if the guest loses the browser session.
- When a queue number has been assigned, the confirmation/payment email may include the stable queue number.
- Dynamic values such as `Orders Ahead` and `Estimated Wait` are shown on the tracking page rather than treated as fixed email values.

### 8.5 Real-Time Tracking Behavior
- The customer tracking page should receive relevant changes to order status, payment confirmation, and queue-related information while it is open.
- If real-time updates are temporarily unavailable, the guest tracking experience should remain usable through periodic refresh/polling behavior.
- The exact real-time transport mechanism is a technical implementation concern and is not a business rule.

---

## 9. Staff & Admin Operational Rules

### 9.1 Staff Access
- Staff must authenticate before accessing staff functions.
- Staff may operate only on orders within their assigned outlet scope.
- Staff may confirm eligible cash payments.
- Staff may move paid orders through the operational lifecycle.
- Staff may cancel eligible orders and handle refunds according to policy.
- Staff may view and resolve relevant Exception Queue items.

### 9.2 Staff-Assisted Ordering
- Staff may help a customer complete the same public Guest Ordering Flow.
- The resulting order remains a Guest Order.
- No separate staff-order category or source is required.

### 9.3 Operational Dashboard Assumption
For the MVP, the operational dashboard is intended to be handled by one designated staff/cashier account per outlet at a time.
This is an **operational assumption, not a system-enforced single-session constraint**.
Multiple staff accounts assigned to the same outlet may technically be logged in concurrently. Regardless of the number of logged-in staff users, repeated or concurrent actions must not produce duplicate business effects.

### 9.4 Admin Access
- Admin must authenticate before administration functions can be used.
- Admin may manage outlets, tables, catalog, product options, inventory, staff accounts, and outlet assignments.
- Admin may view and resolve Exception Queue items across all outlets.
- Admin may filter exception information by outlet and resolved/unresolved status.

---

## 10. Future Customer Account Rules
Customer accounts are out of scope for the MVP.
When customer accounts are introduced in a future version:
- An order may optionally be associated with a customer account.
- Existing Guest Orders may remain Guest Orders.
- Account association must be explicit and secure.
- Existing guest orders must not be automatically linked to an account solely because the email address matches.
- The future account feature must not require changes to the core guest ordering journey for customers who remain guests.

Conceptually:
```text
Guest Order
customerId = NULL

Future Member Order
customerId = authenticated customer ID
```
Detailed customer-account requirements belong in a separate future planning document.
