# VogueGarb: Product Requirements Document

**Project:** HNG15, Lesson 2 (Individual Task)
**Deadline:** Friday, 11:59 PM WAT
**Owner:** Mustapha Agboola
**Status:** Draft v1

---

## 1. Overview

VogueGarb is a fashion design and styling store based in Lagos, Nigeria. This project delivers a working online shop where customers sign in with Google, browse garments, add them to a cart, check out, and receive an email confirmation. All data is stored in a hosted Postgres database.

## 2. Goals

1. Ship a complete, deployed, end-to-end shopping flow before the deadline.
2. Meet all four HNG requirements: checkout page, database persistence, Mailgun confirmation emails, Google auth.
3. Present VogueGarb as a credible fashion brand (clean, mobile-first, fast).

## 3. Non-Goals (out of scope for this deadline)

- Real payment processing (checkout uses a mock "Pay on delivery / Pay later" flow)
- Admin dashboard (products are seeded directly in the database)
- Inventory management, discount codes, reviews, wishlists
- Multi-currency or multi-language support
- Native mobile apps

## 4. Target Users

| User | Need |
|---|---|
| **Shopper** | Browse VogueGarb pieces on a phone, order quickly, get proof of the order |
| **Store owner** | Orders saved reliably, with customer and delivery details |
| **HNG reviewer** | Live link, working flow, readable repo |

## 5. Requirements

### 5.1 Functional

**FR1: Authentication (Google)**
- Sign in and sign out with Google via Supabase Auth (Google Cloud Console OAuth client).
- Browsing is public. Checkout and "My Orders" require login.
- Session persists across refresh.

**FR2: Product catalog**
- Home page with featured products and a link to the full shop.
- Shop page: product grid with image, name, price (₦), optional category filter.
- Product detail page: images, description, price, size selector, quantity, "Add to cart".

**FR3: Cart**
- Add, remove, and change quantity. Shows subtotal.
- Persists in localStorage for guests and logged-in users.
- Cart badge in the header.

**FR4: Checkout page**
- Requires login. Redirects to login, then back to checkout.
- Order summary (items, quantities, total).
- Form: full name, phone, delivery address, city, state, optional notes (e.g. measurements or customization requests).
- Client and server validation.
- "Place order" creates the order in the database.

**FR5: Order persistence**
- Orders and line items saved in Supabase Postgres.
- Totals are recalculated **server-side** from database prices, never from client input.
- Each order is linked to the authenticated user.

**FR6: Confirmation email (Mailgun)**
- Sent after the order is successfully saved.
- Contains order ID, items, quantities, total, and delivery details.
- An email failure must **not** roll back the order. It is logged and `email_sent_at` stays null.

**FR7: Order success and history**
- Success page shows the order ID and summary.
- "My Orders" lists the logged-in user's past orders.

### 5.2 Non-Functional

- **Security:** Row Level Security on all user data. Secrets only in server-side env vars.
- **Performance:** Pages load fast on mobile networks. Images are optimized.
- **Responsive:** Mobile-first layout.
- **Accessibility:** Semantic HTML, alt text, visible focus states.
- **Reliability:** Double-submit protection on "Place order".

## 6. Data Model

**products**
`id (uuid)`, `name`, `slug (unique)`, `description`, `price` (integer, naira), `category`, `image_url`, `sizes (text[])`, `in_stock (bool)`, `created_at`

**orders**
`id (uuid)`, `user_id (→ auth.users)`, `status` (`pending` | `confirmed`), `total` (integer), `full_name`, `phone`, `address`, `city`, `state`, `notes`, `email_sent_at`, `created_at`

**order_items**
`id`, `order_id (→ orders)`, `product_id (→ products)`, `name` (snapshot), `unit_price` (snapshot), `size`, `quantity`

**RLS summary**
- `products`: public read.
- `orders` / `order_items`: users can read and insert only their own rows.

## 7. User Flow

1. Visitor lands on Home and browses the Shop.
2. Opens a product, selects size, adds to cart.
3. Opens Cart and clicks Checkout.
4. If logged out, signs in with Google and returns to Checkout.
5. Fills the delivery form and places the order.
6. Server validates, recalculates the total, saves the order, and sends the Mailgun email.
7. Customer lands on the Order Success page and finds the email in their inbox.

## 8. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Database + Auth | Supabase (Postgres + Google OAuth) |
| Email | Mailgun (server-side) |
| Hosting | Netlify |
| Auth provider setup | Google Cloud Console (OAuth consent screen + Web client) |

## 9. Milestones

| When | Deliverable |
|---|---|
| Thursday night | Accounts set up (Google, Supabase, Mailgun), schema + seed data, skeleton deployed, Google login working |
| Friday morning | Shop, product detail, cart, checkout, order saving |
| Friday afternoon | Mailgun email, success page, My Orders, RLS |
| Friday evening (by ~9 PM) | Full test on the live URL, README, submit |

## 10. Acceptance Criteria

- [ ] A new user can sign in with Google on the **deployed** site.
- [ ] A signed-in user can add items to the cart and complete checkout.
- [ ] The order and its items appear in Supabase with the correct total.
- [ ] A confirmation email arrives in the customer's inbox with correct details.
- [ ] A user cannot read another user's orders.
- [ ] The site works on a phone-sized screen.
- [ ] No secrets in the repo; `.env.example` is provided.
- [ ] README includes live URL, setup steps, and env var list.

## 11. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Mailgun sandbox only sends to authorized recipients | Add test emails as authorized recipients early, or verify a custom domain |
| Google OAuth redirect mismatch after deploy | Add production URL to Google redirect URIs and Supabase site URL on deploy day |
| Secret keys exposed to the client | Server-only env vars; never prefix secrets with `NEXT_PUBLIC_` |
| Running out of time | Deploy a skeleton tonight; cut "My Orders" and category filter first if needed |
| Price tampering from the client | Server recomputes all totals from database prices |

## 12. Deliverables

- Live deployed URL
- Public GitHub repository
- README with setup instructions
- `PRD.md` and `AGENTS.md` in the repo root
