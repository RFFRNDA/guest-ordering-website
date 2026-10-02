# DESIGN — Guest-First Cafe Ordering Platform

**Document Status:** Draft v1.0  
**Design Direction:** Monochrome, minimal, editorial F&B experience  
**Reference:** `f&b-reference1.jpg`  
**Purpose:** Define the visual and interaction direction for the MVP.

> The reference image is used as a **visual direction**, not as a pixel-perfect template. Layouts, content, imagery, and interactions may be adapted to fit the Guest-First ordering product.

---

# 1. Design Goals
The design should support the product's core goal:

> **Make ordering as fast and frictionless as possible for a guest who does not have an account and may arrive from a table QR code.**

The design should therefore prioritize:
1. **Clarity** — Guests should immediately understand where they are and what they can order.
2. **Speed** — The interface should minimize unnecessary navigation and input.
3. **Visual confidence** — Product images, prices, and availability should be easy to scan.
4. **Consistency** — Guest, Staff, and Admin interfaces should share a recognizable design language while serving different workflows.
5. **Mobile-first usability** — The guest ordering experience is primarily designed for mobile browsers.
6. **Calm presentation** — Avoid excessive color, decoration, or visual noise.

---

# 2. Visual Direction
The primary visual direction is inspired by the provided F&B reference:
- Monochrome color palette.
- White/light surfaces with strong black typography and actions.
- Large food imagery.
- Generous whitespace.
- Rounded cards.
- Rounded buttons with strong contrast.
- Minimal iconography.
- Clear visual hierarchy.
- Editorial-style composition rather than dense dashboard styling.
- Soft separation between sections using whitespace, borders, and subtle gray surfaces.

The design should feel:
```text
Clean
Modern
Minimal
Premium
Approachable
Food-focused
```
The design should not become overly decorative at the expense of ordering speed.

---

# 3. Color System

## 3.1 Primary Direction
Use a monochrome palette as the default visual language.

Recommended starting palette:
| Token | Value | Usage |
|---|---|---|
| `black` | `#111111` | Primary buttons, headings, strong text |
| `white` | `#FFFFFF` | Main page background |
| `gray-50` | `#F8F8F8` | Soft section/card backgrounds |
| `gray-100` | `#F1F1F1` | Input backgrounds, subtle surfaces |
| `gray-200` | `#E5E5E5` | Borders/dividers |
| `gray-400` | `#A3A3A3` | Secondary text |
| `gray-600` | `#525252` | Body text / secondary controls |
| `gray-800` | `#262626` | Strong secondary text |

These values are starting design tokens and may be adjusted during implementation.

## 3.2 Semantic States
The main visual language remains monochrome, but status communication may require limited semantic colors.

Use semantic colors **sparingly and consistently**:
- **Success:** Reserved for completed/successful actions when visual distinction is necessary.
- **Warning:** Reserved for attention-required states.
- **Error:** Reserved for invalid input, failed payment, unavailable items, or system errors.
- **Info:** Reserved for neutral informational states.
Semantic colors should not dominate the interface.

---

# 4. Typography

## 4.1 Typography Direction
Typography should be clean, bold, and easy to scan.
The reference uses strong large headings and compact supporting text. Apply a similar hierarchy without copying its exact typography.

Hierarchy:
- **Display:** Large marketing/hero statement where applicable.
- **H1:** Main page heading.
- **H2:** Major section heading.
- **H3:** Card/product/group heading.
- **Body:** General descriptive content.
- **Label:** Form labels, metadata, status labels.
- **Caption:** Secondary information.

## 4.2 Typography Principles
- Use strong weight for headings and primary actions.
- Use regular weight for descriptive text.
- Avoid very long text blocks in the guest ordering flow.
- Maintain high contrast.
- Prices should be visually prominent but not oversized.
- Product names should remain readable when scanned quickly.

---

# 5. Spacing
Use a consistent spacing scale.

Recommended base:
```text
4px
8px
12px
16px
20px
24px
32px
40px
48px
64px
```

Guest screens should generally use more whitespace than Staff/Admin operational screens.

Prioritize spacing around:
- Product imagery.
- Product names.
- Prices.
- Primary actions.
- Checkout sections.
- Order status.
- Queue information.

---

# 6. Shape and Radius
The reference uses rounded, soft geometry.

Recommended radius tokens:
- Small: 8px
- Medium: 12px
- Large: 16px
- Extra Large: 24px
- Pill: 999px


Use:
- `12–16px` for most cards.
- `12–16px` for standard buttons.
- `16–24px` for larger hero/product surfaces.
- Pill shapes for compact status chips where appropriate.

Avoid excessive rounded shapes on every element. Radius should create a consistent visual language rather than visual clutter.

---

# 7. Buttons

## 7.1 Primary Button
Primary actions should use a strong monochrome treatment:

```text
Background: Black
Text: White
Shape: Rounded
Weight: Semibold/Bold
```

Examples:
```text
View Menu
Add to Cart
Continue to Checkout
Pay Now
Confirm Payment
```

The reference's strong black CTA treatment should be used as inspiration.

## 7.2 Secondary Button
Secondary actions should use:
```text
Background: White or soft gray
Border: Light gray or black
Text: Black
```

Examples:
```text
Edit Table
Back
Cancel
View Details
```

## 7.3 Icon Button
Icon-only buttons may be used for compact actions such as:
- Cart.
- Increment/decrement quantity.
- Close.
- Back.
- Navigation.
Every icon-only control should have an accessible label.

## 7.4 Button States
Every interactive button should support:
```text
Default
Hover
Pressed
Focus
Disabled
Loading
```
Loading states must prevent accidental duplicate actions.

---

# 8. Cards
Cards are one of the main visual references from the provided design.

## 8.1 Product Card
The product card should prioritize:
```text
Image
↓
Product Name
↓
Short Description
↓
Price
↓
Availability / Action
```
The exact arrangement can change based on screen width.

## 8.2 Product Cards Should
- Have rounded corners.
- Use clean white or soft-gray surfaces.
- Use strong imagery.
- Keep text compact.
- Make the primary action easy to find.
- Avoid excessive metadata.

## 8.3 Order Card
Staff order cards should prioritize operational scanning:
```text
Queue Number
Order Number
Order Type
Table (if Dine In)
Customer Name
Items
Payment Status
Order Status
Primary Action
```
The most important information should be visually strongest.

---

# 9. Imagery
Food imagery is an important part of the visual direction.

## 9.1 Product Images
Recommended:
- High-quality food photography.
- Consistent aspect ratios.
- Clean backgrounds where possible.
- Subject centered or compositionally balanced.
- Avoid inconsistent image treatment across products.

## 9.2 Image Treatment
The product UI should support:
```text
Image
→ rounded container
→ consistent aspect ratio
→ object-fit cover/contain according to content
```
Do not force a single crop style if it removes important parts of the food.

## 9.3 Missing Images
When a product has no image:
- Use a clean neutral placeholder.
- Preserve card dimensions.
- Do not make the missing image area visually dominant.

---

# 10. Guest Experience Design
The guest flow is the most important experience in the product.

## 10.1 Guest Design Principles
The guest should always know:
```text
Where am I?
What can I order?
What is in my cart?
What do I need to do next?
What is the current payment state?
What is the current order state?
```

The interface should avoid unnecessary account-oriented patterns such as:
- Login prompts.
- Registration prompts.
- Profile navigation.
- Password creation.
- Customer account dashboards.

---

# 11. Guest Screen Structure

## 11.1 Outlet Menu
The main menu page should include:
```text
Header
├── Outlet Name
├── Cart
└── Optional table/context indicator

Category Navigation
↓
Product Grid/List
```

When opened through a table QR:
```text
Dine In
Table X
```

may be shown as a compact context indicator.
The table context should not dominate the menu experience.

---

## 11.2 Product Detail
Product detail should focus on decision-making:
```text
Product Image
Product Name
Description
Base Price
Customization
Notes (where supported)
Quantity
Add to Cart
```
Required customizations should be visually obvious.
Price changes caused by options should update visibly.

---

## 11.3 Cart
The cart should provide a compact review before checkout.

Recommended structure:
```text
Cart
├── Product items
│   ├── Image
│   ├── Name
│   ├── Customization
│   ├── Quantity
│   └── Price
│
├── Subtotal
├── Applicable charges
└── Continue to Checkout
```
The cart should make editing easy without forcing the guest to restart the ordering flow.

---

## 11.4 Checkout
Checkout should be designed as a short, focused form.

Recommended grouping:
```text
Order Type
↓
Dine-In Table (when applicable)
↓
Name
↓
Email
↓
Payment Method
↓
Order Summary
↓
Place Order
```
Do not request customer account information.

---

## 11.5 Payment State
Payment states should be visually clear.

Example:
```text
Payment Pending
Complete your payment to continue.
```

For cash:
```text
Payment Pending
Please pay at the cashier.
```

For successful payment:
```text
Payment Confirmed
Your order is being processed.
```

For failed payment:

```text
Payment Unsuccessful
Please try again or place a new order when available.
```

The exact copy can be refined during UX implementation.

---

# 12. Order Tracking Design

The tracking page should be the most information-focused guest screen after checkout.

Recommended hierarchy:
```text
Order #XXXX

Preparing

Your Queue
#44

3 orders ahead

Estimated Wait
~10 min

Order Summary
...

Payment
Paid

Order Progress
Preparing → Ready → Completed
```

The hierarchy should prioritize:
1. Current order state.
2. Queue number.
3. Orders ahead.
4. Estimated wait.
5. Order details.

Avoid overwhelming the guest with internal operational information.

---

# 13. Order Status Visualization
Customer-facing order progress:
```text
Preparing
    ↓
Ready
    ↓
Completed
```

Use a simple progress indicator.

Example:
```text
●────────────────●────────────○
Preparing      Ready      Completed
```

The active state should have strong visual emphasis.
Payment state should remain visually separate from preparation progress.

---

# 14. Queue Information
Queue information should feel informative rather than stressful.

Recommended presentation:
```text
Your Queue
#44

3 orders ahead

Estimated wait
~10 min
```

Use large typography for the queue number.

`Orders Ahead` and `Estimated Wait` should be clearly labeled as dynamic/informational rather than guaranteed completion times.

---

# 15. QR Context
When a guest opens the platform from a table QR:
```text
Outlet: Cafe Name
Mode: Dine In
Table: 04
```

The context can be displayed in a compact banner, pill, or small information block.
The guest should still be able to review/change the table information before checkout according to the business rules.
Do not visually imply that the QR permanently locks the guest to a physical table.

---

# 16. Staff Experience
Staff screens have different priorities from guest screens.

The staff UI should prioritize:
```text
Speed
Scanning
Status
Queue
Operational actions
```

A staff dashboard may use denser cards/tables than the guest UI.

Suggested structure:
```text
Header
├── Outlet
├── User
└── Logout

Navigation
├── Active Orders
└── Exceptions

Main Content
└── Order Queue
```

---

# 17. Staff Order Card
Recommended staff order card:
```text
#44
Order #ORD-1001

Dine In · Table 04

Customer Name

2 × Product A
1 × Product B
+ Extra Shot

Payment: PAID
Status: NEW

[Start Preparing]
```

The primary action should change based on the current order state.

---

# 18. Exception Queue Design
The Exception Queue should visually distinguish issues that need staff attention.

Recommended information:
```text
Exception Type
Order Number
Raised At
Outlet
Current Order State
Resolution Status
```

Example:
```text
Order #ORD-1001
Inventory Consumption Failed

Raised 10:34
Status: Open

[View Order]
[Resolve]
```

Resolution should use a focused interaction rather than a large multi-step workflow.

---

# 19. Admin Experience
Admin screens can use a more conventional management/dashboard layout while retaining the same visual language.

Suggested structure:
```text
Sidebar
├── Dashboard
├── Outlets
├── Tables / QR
├── Categories
├── Products
├── Product Options
├── Inventory
└── Staff

Main Content
└── Current management screen
```

Admin screens may use:
- Tables.
- Filters.
- Forms.
- Dense cards.
- Modal dialogs.

The same monochrome palette and rounded component language should be preserved.

---

# 20. Navigation

## Guest
Keep navigation minimal.

Potential navigation:
```text
Menu
Cart
Tracking
```
Avoid introducing a persistent multi-level navigation unless the product requires it.

## Staff

```text
Active Orders
Exceptions
```
Additional operational sections may be added later.

## Admin
Management-oriented navigation can be more extensive because the user is performing configuration tasks.

---

# 21. Responsive Design
The product is **mobile-first**, especially for the Guest experience.

## Mobile
Primary design target:
```text
320px+
```

The interface should support:
- Single-column product layout where appropriate.
- Sticky cart/checkout actions when useful.
- Large touch targets.
- Compact checkout forms.
- Easy-to-reach primary actions.

## Tablet
Use:
- Two-column layouts where beneficial.
- Wider product grids.
- Expanded staff dashboard layouts.

## Desktop
Use:
- Multi-column product grids.
- Wider content containers.
- More efficient staff/admin layouts.
- Side navigation for management screens where appropriate.

The guest experience should remain simple even on larger screens.

---

# 22. Interaction Patterns

## Loading
Use:
- Skeletons for content-heavy sections.
- Spinners for short actions.
- Disabled buttons during submissions.

Avoid layout jumps where possible.

## Empty State
Empty states should explain what happened and what the user can do next.

Example:
```text
Your cart is empty.

Browse the menu to add items.

[View Menu]
```

## Error State
Errors should:
- Be near the affected content.
- Explain the problem clearly.
- Provide a recovery action when possible.
- Avoid exposing technical details.

## Success State
Successful actions should provide immediate feedback.

Example:
```text
Added to Cart
```

---

# 23. Forms
Forms should follow these principles:
- Labels are always visible or programmatically associated.
- Required fields are clearly marked.
- Validation happens as early as useful without interrupting the user unnecessarily.
- Error messages explain how to correct the input.
- Input fields are appropriately sized for mobile.
- Email fields should use appropriate mobile keyboard behavior.
- Checkout should avoid unnecessary fields.

---

# 24. Accessibility
The design should aim for accessible interactions from the beginning.

Minimum expectations:
- Semantic HTML.
- Proper form labels.
- Keyboard-accessible controls.
- Visible focus states.
- Sufficient text/background contrast.
- Accessible names for icon buttons.
- Error messages associated with affected fields.
- Status changes communicated appropriately.
- Do not rely on color alone to communicate state.
- Touch targets should be comfortable on mobile devices.

---

# 25. Visual Hierarchy Rules
When deciding what should stand out, use this order:

### Guest
```text
Primary Action
↓
Current State
↓
Product Name
↓
Price
↓
Supporting Information
```

### Staff
```text
Queue / Order
↓
Current Status
↓
Customer / Table
↓
Items
↓
Action
```

### Admin
```text
Page Title
↓
Primary Management Action
↓
Filters / Search
↓
Data
↓
Secondary Actions
```

---

# 26. Component Direction
Reusable components should be created around consistent patterns.

Core components:
```text
Button
IconButton
Input
Select
Textarea
Badge / Status
Card
ProductCard
ProductOptionGroup
QuantityControl
CartItem
OrderCard
OrderStatus
QueueCard
Modal / Dialog
Toast
EmptyState
ErrorState
Skeleton
Navigation
```

Components should support the design tokens defined in this document.

---

# 27. Guest-Specific Components
The MVP should prioritize reusable components for the guest journey:
```text
OutletHeader
TableContext
CategoryTabs
ProductCard
ProductDetail
OptionSelector
CartDrawer / CartSummary
CheckoutForm
PaymentSelector
OrderSummary
PaymentStatus
QueueDisplay
OrderProgress
TrackingHeader
```

The implementation can combine or split these components based on the final information architecture.

---

# 28. Design Principles for Product States

## Product Available
Show normal product content and ordering actions.

## Product Unavailable
The product should remain understandable but must not appear purchasable.

Possible presentation:
```text
Unavailable
```

The exact treatment can be refined during UI implementation.

## Payment Pending
Keep the guest focused on the required payment action.

## Payment Failed
Explain that payment was not confirmed and provide a retry path when allowed.

## Order Ready
Make it visually clear that the order is ready.

## Order Completed
Provide a clear completion state without unnecessary additional actions.

---

# 29. Design Decisions Explicitly Influenced by the Reference
The provided reference influences the MVP design in these areas:

### Color
```text
Monochrome
Black + White + Neutral Gray
```

### Buttons
```text
Strong black primary buttons
Rounded corners
High contrast
Simple labels
```

### Cards
```text
Rounded cards
Soft surfaces
Generous whitespace
Large imagery
Minimal metadata
```

### Layout
```text
Clean editorial composition
Large headings
Strong image-to-text relationships
Whitespace-driven sections
```

These are **visual inspirations**, not strict layout requirements.

---

# 30. What Is Intentionally Not Copied From the Reference
The reference contains concepts that are not part of the current MVP or do not directly match the product.

The MVP should therefore **not** automatically copy:
- App-store download sections.
- Table reservation marketing sections.
- Unrelated service/marketing blocks.
- Exact hero layout.
- Exact text content.
- Exact product names or images.
- Exact navigation.
- Exact card dimensions.
- Exact illustrations or decorative assets.

The Guest-First platform should remain focused on ordering and order operations.

---

# 31. Design-to-Requirement Mapping
| Product Requirement | Design Response |
|---|---|
| Guest-first ordering | Minimal, account-free guest flow |
| QR table context | Compact table/context indicator |
| Dine In / Take Away | Simple order-type selector |
| Product customization | Focused option selector |
| Guest cart | Persistent/accessible cart summary |
| Cash / Online payment | Clear payment-method selector |
| Payment pending | Separate payment-state component |
| Order tracking | Dedicated tracking screen |
| Queue number | Prominent queue display |
| Orders Ahead | Secondary but visible queue information |
| Estimated wait | Informational wait-time block |
| Staff order processing | Dense operational order cards |
| Exception Queue | Attention-oriented exception cards/table |
| Multi-outlet admin | Outlet-aware management navigation |
| Mobile-first | Touch-friendly responsive layouts |

---

# 32. Design Principles for Future Extensions
Future functionality should preserve the same core design language.

When customer accounts are introduced later:
- Do not redesign the entire guest ordering flow solely because accounts exist.
- Guest ordering should remain a valid path.
- Account functionality should be added progressively.

When more advanced operations are introduced:
- Add complexity where it provides operational value.
- Preserve the clean hierarchy of the existing staff interface.

---

# 33. Design Acceptance Criteria
The design direction is considered ready for implementation when:
1. A guest can understand the outlet context immediately.
2. A guest can browse products without authentication.
3. Product cards clearly communicate image, name, price, availability, and action.
4. Product customization is understandable before adding to cart.
5. Cart contents are easy to review and edit.
6. Checkout requests only required MVP information.
7. Payment state is visually distinct from order preparation state.
8. Order tracking prominently communicates current status and queue information.
9. Staff can scan active orders quickly.
10. Exceptions requiring attention are visually distinguishable.
11. Admin management screens remain consistent with the monochrome design language.
12. The core guest flow remains comfortable on mobile screens.

---
