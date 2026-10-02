# PRD — Guest-First Cafe Ordering Platform

**Document Status:** Draft v1.1  
**Product Type:** Multi-outlet F&B ordering and operations platform  
**Primary Goal:** Fast, low-friction ordering for café/F&B customers without customer accounts  
**Target Platform:** Responsive web application  
**Last Updated:** 2026-09-27

---

# 1. Product Overview

## 1.1 Product Vision
Build a **guest-first digital ordering platform for cafés or F&B outlets** where customers can browse products, customize an order, pay, and track order status through a responsive website **without creating an account or installing a mobile application**.

The same **Guest Ordering Flow** can be used independently by a guest or with assistance from staff. Staff assistance does not create a separate order type; the resulting order is still a Guest Order.

The platform also provides operational tools for staff and centralized management for administrators.

Customer accounts are explicitly **out of scope for the current MVP**. The product should remain extensible so that customer accounts can be introduced later without making an account a prerequisite for the current ordering flow.

---

## 1.2 Problem Statement
Digital ordering experiences can introduce unnecessary friction, such as:
- Mandatory registration before ordering.
- Required mobile-app installation.
- Limited order visibility after payment.
- Unclear synchronization between payment and order status.
- Operational complexity caused by mixing customer identity, order identity, and payment identity.

The product aims to provide a simpler guest ordering experience while maintaining reliable payment handling, order integrity, and operational control.

---

## 1.3 Product Hypothesis
If a customer can scan a QR code or open an outlet URL and immediately order through a responsive website without registration or app installation, then the effort required to place an F&B order can be reduced while the outlet still receives structured, trackable, and payment-verified orders.

---

## 1.4 Core Value Proposition

### For Guests
- No customer account required.
- No app download required.
- Table context can be provided through a QR code.
- Simple menu → cart → checkout → payment → order tracking flow.
- Temporary access to track the order.

### For Staff
- Clear visibility of actionable paid orders.
- Simple operational order flow.
- Ability to assist guests with ordering.
- Ability to confirm cash payments.
- Ability to process orders through completion.

### For Admins
- Centralized management of multiple outlets.
- Management of tables and QR ordering context.
- Management of categories, products, and product options.
- Basic inventory management.
- Staff account and outlet-assignment management.
- Visibility of operational exceptions.

---

# 2. Goals and Non-Goals

## 2.1 Product Goals

### G01 — Frictionless Guest Ordering
Allow customers to complete the core ordering journey without:
- Creating an account.
- Logging in.
- Installing a mobile application.

Only information required for ordering and fulfillment should be requested.

### G02 — Reliable Order Lifecycle
Provide a clear order journey from order creation through payment, preparation, readiness, and completion.

### G03 — Trusted Payment State
Ensure that an order is treated as paid only after the applicable payment confirmation has been received and validated.

### G04 — Operational Staff Workflow
Allow staff to:
- Assist guests with ordering.
- Confirm cash payments.
- View actionable orders.
- Process orders through preparation and completion.
- Handle eligible cancellations and operational exceptions.

### G05 — Centralized Administration
Provide administration capabilities for:
- Outlets.
- Tables and QR context.
- Categories.
- Products.
- Product options.
- Basic inventory.
- Staff accounts and assignments.

### G06 — Future-Ready Customer Architecture
Keep customer accounts optional so that future account functionality can be introduced without making accounts a prerequisite for the current ordering flow.

---

## 2.2 Non-Goals for Initial MVP
The following are explicitly out of scope:
- Customer registration.
- Customer login/authentication.
- Customer profile.
- Customer order history.
- Customer favorites.
- Customer loyalty points.
- Native iOS/Android application.
- Delivery logistics and courier dispatching.
- Full marketplace functionality across unrelated merchants.
- Advanced accounting/bookkeeping.
- Complex procurement/supplier management.
- Advanced warehouse management.
- Real-time kitchen display hardware integration.
- Advanced recommendation/personalization engine.
- Complex promotion/coupon engine.
- Enterprise analytics/data warehouse.
- Ingredient-level inventory.
- Advanced stock-movement workflows.

These capabilities may be considered in future product phases.

---

# 3. Product Principles
1. **Guest-first:** A customer account must never be required for the core ordering journey.
2. **Simple ordering:** The guest should be able to move from menu to order with minimal friction.
3. **Payment-trustworthy:** Customer-facing payment UI is not the final source of truth for payment state.
4. **Operationally clear:** Payment status and order status represent different concepts.
5. **Least privilege:** Staff and administrators only access resources within their permitted scope.
6. **Responsive by default:** The customer ordering experience must work well on mobile browsers.
7. **Recoverable:** Failed, expired, duplicated, and retried operations should have predictable outcomes.
8. **Traceable:** Important business actions should remain traceable.
9. **Progressive complexity:** The MVP should avoid unnecessary product and technical complexity.
10. **Future-extensible:** MVP decisions should not unnecessarily block future customer-account capabilities.

Detailed business rules are maintained in `BUSINESS_RULES.md`.

---

# 4. Users and Actors

## 4.1 Guest Customer
The only customer type supported in the MVP.

A guest can:
- Browse the menu.
- Customize products.
- Add products to a cart.
- Choose Dine In or Take Away.
- Enter the required checkout information.
- Pay using a supported payment method.
- Track the resulting order.

A guest does not create or use a customer account.

### Guest Needs
- Fast menu access.
- Clear product information.
- Easy customization.
- Minimal checkout friction.
- Clear payment instructions.
- Reliable order tracking.

---

## 4.2 Staff
An outlet employee responsible for operational order handling.

Staff can:
- Authenticate into the staff area.
- View actionable orders within assigned outlet scope.
- Assist customers using the same Guest Ordering Flow.
- Confirm cash payments.
- Process orders through preparation.
- Mark orders as ready and completed.
- Perform eligible cancellation/refund actions.
- Resolve operational exceptions.

---

## 4.3 Admin
A platform/operator administrator responsible for system configuration and management.

Admin can:
- Authenticate into the administration area.
- Manage outlets.
- Manage tables and QR ordering context.
- Manage categories and products.
- Manage product options.
- Manage basic inventory.
- Manage staff accounts and outlet assignments.
- View and resolve operational exceptions across outlets.

---

## 4.4 System / Background Worker
A non-human system actor responsible for automated processing such as:
- Payment event processing.
- Background jobs.
- Order-expiration processing.
- Notification delivery.
- Cleanup tasks.

The system actor is not a user role that logs into the application.

---

# 5. Core User Flows

## 5.1 Guest Dine-In
```text
Scan Table QR
      ↓
Open Outlet Menu
      ↓
Browse Products
      ↓
Customize Product
      ↓
Add to Cart
      ↓
Review Cart
      ↓
Checkout
      ↓
Confirm Dine-In / Table
      ↓
Enter Name + Email
      ↓
Choose Payment Method
      ↓
Create Order
      ↓
Payment Confirmation
      ↓
Track Order
      ↓
Preparing → Ready → Completed
```

---

## 5.2 Guest Take-Away
```text
Open Outlet Menu
      ↓
Choose Take Away
      ↓
Browse Products
      ↓
Customize Product
      ↓
Add to Cart
      ↓
Checkout
      ↓
Enter Name + Email
      ↓
Choose Payment Method
      ↓
Create Order
      ↓
Payment Confirmation
      ↓
Track Order
      ↓
Preparing → Ready → Completed
```

---

## 5.3 Staff-Assisted Guest Ordering
Staff assistance uses the same public Guest Ordering Flow as a guest.

```text
Customer Requests Assistance
      ↓
Staff Opens Guest Ordering Flow
      ↓
Customer + Staff Complete Ordering Flow
      ↓
Create Guest Order
      ↓
Payment Confirmation
      ↓
Normal Staff Processing
```

Staff assistance does not create a separate order type or separate customer flow.

---

## 5.4 Staff Operational Flow
```text
Staff Login
      ↓
View Actionable Orders
      ↓
Open Order
      ↓
Prepare Order
      ↓
Mark Ready
      ↓
Complete Order
```

---

## 5.5 Admin Flow
```text
Admin Login
      ↓
Admin Dashboard
      ├── Outlets
      ├── Tables / QR
      ├── Categories
      ├── Products
      ├── Product Options
      ├── Inventory
      └── Staff
```

---

# 6. Functional Requirements

## 6.1 Guest Experience

### FR-C01 — Open Outlet
Guests shall be able to open an active outlet menu through a public URL without authentication.

**Acceptance Criteria**
- An active outlet can be opened without customer authentication.
- An inactive outlet cannot accept new orders.
- The guest can identify which outlet they are viewing.

### FR-C02 — Table QR Context
The platform shall support table-specific QR ordering context for Dine In.

**Acceptance Criteria**
- A valid table QR opens the correct outlet context.
- Dine In is selected by default when appropriate.
- The scanned table number is initially available to the guest.
- The guest can review or edit the table number before checkout.
- Invalid QR/outlet context is handled with a clear user-facing message.

### FR-C03 — Browse Categories
Guests shall be able to browse active product categories.

**Acceptance Criteria**
- Active categories are visible.
- Products follow the configured display order.
- Empty or inactive categories are handled gracefully.

### FR-C04 — Browse Products
Guests shall be able to view product information including, at minimum:
- Product name.
- Product image where available.
- Description.
- Price.
- Availability.
- Available customization options where applicable.

### FR-C05 — Product Customization
Guests shall be able to select supported product options.
Examples include:
- Size.
- Sugar level.
- Ice level.
- Add-ons.
- Toppings.

**Acceptance Criteria**
- Required options must be completed before the product can be added to the cart.
- Optional options may be skipped.
- Price-changing selections are reflected in the displayed order amount.
- Invalid selections are rejected.

### FR-C06 — Cart
Guests shall be able to:
- Add items.
- Change quantities.
- Remove items.
- Review selected customizations.
- Review subtotal.
- Review applicable charges.
- Review the estimated final amount.

The cart is temporary and does not represent the authoritative transaction.

### FR-C07 — Order Type
The platform shall support:
```text
DINE_IN
TAKE_AWAY
```

**Acceptance Criteria**
- Dine In requires table information at checkout.
- Take Away does not require table information.
- Table context from QR may be changed before order creation.

### FR-C08 — Guest Checkout
Checkout shall collect only the information required for the MVP transaction:
- Name.
- Email.
- Order type.
- Table when applicable.
- Payment method.

No customer account credentials are requested.

### FR-C09 — Create Guest Order
The platform shall create a Guest Order after checkout.

**Acceptance Criteria**
Before creating the order, the system must verify that:
- The outlet is active.
- Selected products are available.
- Selected options are valid.
- Requested quantities are valid.
- The order information is valid.
- The selected payment method is supported.

### FR-C10 — Guest Order Tracking
After order creation, the guest shall receive temporary access to the order tracking experience.

The tracking experience may display:
- Order number.
- Queue number when available.
- Orders ahead when meaningful.
- Estimated wait when meaningful.
- Order items.
- Total amount.
- Payment method/status.
- Customer-facing order status.
- Relevant timestamps.

A guest can only access the order associated with the provided tracking access.

### FR-C11 — Payment
The MVP shall support:
```text
CASH
ONLINE
```

Cash payment is completed through the outlet cashier.
Online payment is completed through the configured online payment provider.
An order is not operationally actionable until payment is confirmed.

### FR-C12 — Queue Information
For eligible orders, the guest tracking experience shall provide:
- **Your Queue:** queue number.
- **Orders Ahead:** current number of relevant active orders ahead.
- **Estimated Wait:** approximate wait information.

The MVP uses a default estimated wait of approximately **10 minutes**.
Queue and wait information is informational and does not represent a guaranteed completion time.

### FR-C13 — Order Status Tracking
Guests shall see customer-facing operational progress:
```text
Preparing
Ready
Completed
```
Payment status is displayed separately when payment is still pending or requires guest action.

### FR-C14 — Payment Pending / Failure
When payment has not yet been confirmed, the guest shall receive a clear payment-related state and instruction.

Examples:
```text
Payment Pending
Please complete your online payment.
```

or:
```text
Payment Pending
Please pay at the cashier to continue.
```

Where online payment retry is available, the guest may retry according to the defined payment rules.

### FR-C15 — Tracking Link Recovery
Because customers do not have accounts:
- The tracking URL is shown immediately after order creation.
- The tracking URL is also sent to the customer's email in the MVP.
- The same tracking access is used to revisit the order.
- Dynamic values such as Orders Ahead are shown on the tracking experience rather than treated as fixed email values.

---

## 6.2 Staff Features

### FR-S01 — Staff Authentication
Staff must authenticate before accessing staff functions.

### FR-S02 — Staff Outlet Scope
Staff shall only see and operate on orders within their assigned outlet scope.

### FR-S03 — Staff-Assisted Guest Ordering
Staff may assist a customer using the public Guest Ordering Flow.

**Acceptance Criteria**
- Staff can open the same Guest Ordering Flow.
- Staff can assist with product selection and customization.
- Staff can assist with checkout.
- The resulting order remains a Guest Order.
- No separate staff-created order type is introduced.

### FR-S04 — Active Orders
Staff shall have an operational view of actionable paid orders.

The operational flow supports:
```text
NEW
PREPARING
READY
```

Cancelled orders requiring manual resolution are handled through the Exception Queue.

### FR-S05 — Order Detail
Staff shall be able to view relevant order information, including:
- Order number.
- Queue number when available.
- Order type.
- Table when applicable.
- Customer name.
- Customer email where needed.
- Items and quantities.
- Product customizations.
- Notes.
- Payment information.
- Order status.
- Relevant timestamps.

### FR-S06 — Confirm Cash Payment
Authorized staff shall be able to confirm receipt of cash for a cash order.

After valid confirmation:
```text
Payment = PAID
Order = NEW
```

### FR-S07 — Update Order Status
Staff shall be able to move eligible paid orders through:
```text
NEW → PREPARING → READY → COMPLETED
```

### FR-S08 — Cancellation / Refund
Staff shall be able to handle eligible cancellations.
The applicable cancellation/refund behavior depends on payment state, payment method, and current order status.

### FR-S09 — Prevent Unpaid Processing
An unpaid order must not be treated as an active preparation order.

### FR-S10 — Exception Queue
The platform shall provide a dedicated Exception Queue for operational issues requiring manual resolution.

The queue shall allow staff to:
- View unresolved exceptions within assigned outlet scope.
- Open the related order.
- Review the exception.
- Record a resolution action.
- Add an optional resolution note.
- Mark the exception as resolved.

Exception resolution does not automatically change the related order/payment state unless a separate valid action is performed.

---

## 6.3 Admin Features

### FR-A01 — Admin Authentication
Admin must authenticate before accessing administration functions.

### FR-A02 — Outlet Management
Admin shall be able to:
- Create outlets.
- Edit outlet information.
- Activate/deactivate outlets.
- View outlet details.
- Configure operating hours.
- Configure the table-number range used for guest Dine In.

### FR-A03 — Table and QR Management
Admin shall be able to:
- Create tables.
- Edit tables.
- Activate/deactivate tables.
- View the stable public ordering URL for a table.
- View or download the QR representation.

Physical QR printing and placement are operational activities outside the system.

### FR-A04 — Category Management
Admin shall be able to:
- Create categories.
- Edit categories.
- Activate/deactivate categories.
- Configure display order.

### FR-A05 — Product Management
Admin shall be able to:
- Create products.
- Edit products.
- Activate/deactivate products.
- Set price.
- Assign category.
- Configure availability.
- Configure product image.
- Configure description.
- Configure customization options.

### FR-A06 — Product Options
Admin shall be able to configure product customization groups and options.

The configuration shall support, at minimum:
- Required/optional groups.
- Single/multiple selection.
- Minimum/maximum selection rules where applicable.
- Option-level price adjustments.
- Option availability.

### FR-A07 — Basic Inventory
Admin shall have basic product-level inventory visibility and adjustment capability.
Advanced ingredient-level inventory and warehouse functionality are outside MVP scope.

### FR-A08 — Staff Management
Admin shall be able to:
- Manage staff accounts.
- Assign staff to one or more outlets.
- Update outlet assignments.

### FR-A09 — Cross-Outlet Exception Visibility
Admin shall be able to view exceptions across outlets and filter the Exception Queue by outlet and resolution status.

---

# 7. MVP Scope
The MVP should prove the complete core value loop:

> **QR/menu → customize → cart → checkout → payment → tracking → staff preparation → completion**

## 7.1 Guest Experience
- Public outlet menu.
- Table QR context.
- Dine In / Take Away.
- Categories.
- Products.
- Product details.
- Product customization.
- Guest cart.
- Guest checkout.
- Guest order creation.
- Cash payment.
- Online payment in sandbox/test environment.
- Payment confirmation.
- Guest tracking access.
- Order tracking.
- Queue information.
- Approximate wait information.
- Payment-state feedback.

## 7.2 Staff
- Staff authentication.
- Outlet-scoped access.
- Staff dashboard.
- Actionable order queue.
- Order detail.
- Cash payment confirmation.
- Preparing status.
- Ready status.
- Completed status.
- Eligible cancellation/refund handling.
- Exception Queue.
- Staff-assisted Guest Ordering.

## 7.3 Admin
- Admin authentication.
- Outlet management.
- Table and QR management.
- Category management.
- Product management.
- Product option management.
- Basic product-level inventory.
- Staff management.
- Cross-outlet Exception Queue.

Technical infrastructure supporting the MVP is defined in `ARCHITECTURE.md`.

---

# 8. Post-MVP / Future Scope

## 8.1 Customer Account
Potential future capabilities:
- Customer registration/login.
- Customer profile.
- Order history.
- Favorites.
- Loyalty.
- Secure guest-order claiming.
Customer-account requirements should be defined before implementation.

## 8.2 Operational Improvements
Potential future capabilities:
- More advanced wait-time estimation.
- Richer operational reporting.
- More granular staff roles.
- Kitchen display integration.
- Improved notification capabilities.

## 8.3 Advanced Inventory
Potential future capabilities:
- Inventory transactions.
- Ingredient-level stock.
- Recipe/BOM-based stock consumption.
- Waste tracking.
- Warehouse management.
- Stock reporting.

## 8.4 Commercial Features
Potential future capabilities:
- Promotions.
- Discount codes.
- Customer loyalty rules.
- More advanced pricing and campaign features.

## 8.5 Analytics
Potential future capabilities:
- Operational analytics.
- Sales reporting.
- Product performance.
- Customer behavior analytics.
- Enterprise data warehouse integration.

---

# 9. MVP Acceptance Criteria
The MVP is considered functionally complete when the following end-to-end scenarios are supported.

## Scenario A — Guest Dine-In
1. An active outlet is available.
2. A guest opens the outlet through a table QR or public outlet URL.
3. The guest browses and customizes products.
4. The guest adds products to the cart.
5. The guest selects Dine In.
6. The guest confirms the table information.
7. The guest enters name and email.
8. The guest chooses Cash or Online payment.
9. The order is created successfully.
10. Payment is confirmed according to the selected payment method.
11. The guest receives access to order tracking.
12. The order becomes visible to staff for operational processing.
13. Staff processes the order through preparation and completion.
14. The guest can see the order progress.

## Scenario B — Guest Take-Away
1. A guest opens an active outlet menu.
2. The guest selects Take Away.
3. The guest browses and customizes products.
4. The guest enters name and email.
5. The guest chooses a payment method.
6. The order is created successfully.
7. Payment is confirmed according to the selected method.
8. The guest receives order tracking access.
9. Staff processes the order through preparation and completion.
10. The guest can see the order progress.

## Scenario C — Payment Not Confirmed
1. A guest creates a valid order.
2. The order remains unavailable for operational preparation while payment is not confirmed.
3. The guest receives clear payment instructions.
4. For eligible online payments, the guest can retry according to the defined payment rules.
5. An unpaid order is eventually handled according to the reservation and expiration rules.
6. The resulting customer-facing state is clear and actionable.

## Scenario D — Staff-Assisted Ordering
1. A customer asks staff for assistance.
2. Staff opens the same Guest Ordering Flow.
3. Staff assists the customer with ordering.
4. The platform creates the same type of Guest Order used by an independent guest.
5. Payment confirmation follows the normal payment flow.
6. Staff can process the resulting order normally.

## Scenario E — Operational Exception
1. A supported operational/payment exception occurs.
2. The issue becomes visible through the Exception Queue.
3. Staff or Admin can open the related order.
4. The user can record a resolution action.
5. The exception can be marked as resolved.
6. Resolving the exception does not unintentionally change the order lifecycle.

---

# 10. Product Constraints and Dependencies
The MVP depends on:
- A configured active outlet.
- A configured menu/catalog.
- Product-level inventory.
- Supported payment methods.
- Customer email for tracking-link delivery.
- Authenticated Staff access.
- Authenticated Admin access.

Detailed technical dependencies and implementation decisions are documented in `ARCHITECTURE.md`.
Detailed business rules are documented in `BUSINESS_RULES.md`.
Detailed domain entities and relationships are documented in `DATA_MODEL.md`.

---

# 11. Related Documents

```text
PRD.md
→ Product requirements, goals, users, functional scope, and MVP definition.

BUSINESS_RULES.md
→ Detailed business rules, state behavior, payment/inventory rules, queue rules, and exception handling.

DATA_MODEL.md
→ Domain entities, relationships, important fields, and data constraints.

ARCHITECTURE.md
→ Technical architecture, API, security, testing, operations, infrastructure, and implementation-level decisions.

DESIGN.md
→ UI/UX structure, interaction design, visual system, responsive behavior, and user experience details.

README.md
→ Project entry point, setup guidance, development workflow, and implementation roadmap.
```

---

# 12. Final MVP Definition
> **A customer can scan a table QR or open an outlet URL, browse and customize the menu, place a Dine In or Take Away Guest Order, provide only the required guest information, choose Cash or Online payment, receive payment confirmation, securely access the order tracking experience, view queue and wait information, and see order progress while staff process the paid order through completion — all without creating a customer account.**
The platform must also support authenticated **Staff** and **Admin** users for operational and management functions.
Customer accounts remain intentionally deferred from the MVP.
