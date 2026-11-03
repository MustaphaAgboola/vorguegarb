# VogueGarb: Product Requirements Document

**Project:** VogueGarb online store — https://voguegarb.app
**Owner:** Mustapha Agboola
**Status:** Live, in active development

---

## 1. Overview

VogueGarb is a fashion design and styling store based in Lagos, Nigeria. This
repository is the store itself: a Next.js website and an Expo mobile app over
one Supabase backend, where customers sign in with Google, browse garments, add
them to a cart, check out, and receive an email confirmation. Orders land in
Postgres and the store owner is emailed about each one.

This document describes what the store does today and what is deliberately
left out. It is the reference for scope decisions — if something here is wrong,
fix this file rather than working around it.

## 2. Goals

1. Take real orders reliably: nothing silently lost, every order reaching the
   owner.
2. Present VogueGarb as a credible fashion brand — clean, mobile-first, fast.
3. Keep customer data private and totals impossible to tamper with.

## 3. What is built

**Authentication**
- Google sign-in via Supabase Auth, on both the website and the mobile app.
- Browsing is public. Checkout, My Orders and `/admin` require login.
- After login the website returns the customer to the page they came from.

**Catalog**
- Home page with featured pieces; shop grid with image, name and price in ₦.
- Category filter on the shop page (`/shop?category=…`).
- Product detail page: images, description, price, size selector, quantity.
- `in_stock` is a boolean — out-of-stock products cannot be ordered. There is
  no per-size or numeric stock count.

**Cart**
- Stored server-side in `cart_items`, not localStorage, and broadcast over
  Supabase Realtime, so the same cart appears on the website and the mobile app
  within moments. RLS means each customer only sees their own.

**Checkout and orders**
- Delivery form: full name, phone, address, city, state, optional notes for
  measurements or customization requests. Validated on the client and again on
  the server with zod.
- `create_order` recalculates the total server-side from database prices and
  snapshots `name` and `unit_price` into `order_items`.
- Double-submit protection on "Place order".
- Payment is on delivery. No payment processor is integrated.

**Email** (Brevo, server-side)
- The customer gets a confirmation with order ID, items, total and delivery
  details; `email_sent_at` records it.
- Every address in `ADMIN_EMAILS` gets a separate "New order" email with the
  customer's contact details, delivery address and notes.
- Neither email can fail or roll back the order.

**Admin**
- `/admin` adds and removes products with photos uploaded to Supabase Storage,
  gated by the server-only `ADMIN_EMAILS` allowlist. Admins also see all
  customers' orders on `/orders`.
- On `/orders`, an admin can move each order between `pending`, `confirmed`,
  `delivered` and `cancelled` (`PATCH /api/admin/orders`, same admin gate).
  Customers see the current status on My Orders on the website and in the app.
  Cancelled orders are left out of the admin revenue total. A status change
  sends no email, and nothing else about the order can be edited.

**Mobile app**
- Expo / React Native app in `mobile/`, sharing the backend and calling the
  website's `/api/cart` and `/api/orders` so order logic exists in one place.

## 4. Not built, and not planned without a decision

- **Payment processing.** Orders are pay-on-delivery. Adding Paystack or
  Flutterwave is the largest open question and affects the order lifecycle.
- **Order lifecycle beyond manual status.** Admins set status by hand (see
  section 3). There are no automatic transitions, no customer-initiated
  cancellation, no status-change emails and no shipping or tracking details.
- **Stock counts.** Only the `in_stock` boolean, so the store can oversell.
- Discount codes, reviews, wishlists, multi-currency, multi-language.

## 5. Data model

**products**
`id (uuid)`, `name`, `slug (unique)`, `description`, `price` (integer, naira),
`category`, `image_url`, `sizes (text[])`, `in_stock (bool)`, `created_at`

**cart_items**
one row per customer per product/size, carrying `quantity`

**orders**
`id (uuid)`, `user_id (→ auth.users)`,
`status` (`pending` | `confirmed` | `delivered` | `cancelled`),
`total` (integer), `full_name`, `phone`, `address`, `city`, `state`, `notes`,
`email_sent_at`, `created_at`

**order_items**
`id`, `order_id (→ orders)`, `product_id (→ products)`, `name` (snapshot),
`unit_price` (snapshot), `size`, `quantity`

**RLS summary**
- `products`: public read. No insert or update policy at all — product writes
  go through the service role behind the admin check, so no browser client can
  write products whoever is signed in.
- `orders`, `order_items`, `cart_items`: customers read and insert only their
  own rows. The admin view of all orders uses the service role behind the same
  check.

## 6. Non-functional requirements

- **Security:** RLS on all customer data. Secrets only in server-side env vars.
  Totals always recomputed server-side from database prices.
- **Money:** stored as an integer number of naira; formatted with
  `Intl.NumberFormat('en-NG', …)`.
- **Performance:** fast on Nigerian mobile networks; images optimized through
  `next/image`.
- **Responsive:** mobile-first.
- **Accessibility:** semantic HTML, alt text on every image, visible focus.

## 7. Customer flow

1. Visitor lands on Home and browses the Shop.
2. Opens a product, selects a size, adds it to the cart.
3. Opens the Cart and clicks Checkout.
4. If logged out, signs in with Google and returns to Checkout.
5. Fills the delivery form and places the order.
6. The server validates, recalculates the total, saves the order, then emails
   the customer and the store.
7. The customer lands on the Order Success page and finds the email in their
   inbox.

## 8. Tech stack

| Layer | Choice |
|---|---|
| Website | Next.js (App Router) + TypeScript, Tailwind CSS |
| Mobile | Expo / React Native + TypeScript, expo-router, EAS builds |
| Database + Auth | Supabase (Postgres, Google OAuth, Realtime, Storage) |
| Email | Brevo transactional API (server-side) |
| Hosting | Netlify (project `vorguegarb`, domain `voguegarb.app`) |

## 9. Invariants to re-check before each deploy

- [ ] A new customer can sign in with Google on the live site.
- [ ] Checkout completes and the order plus its items appear in Supabase with
      the correct total.
- [ ] The customer's confirmation email arrives, and the store's "New order"
      email reaches every `ADMIN_EMAILS` address.
- [ ] A customer cannot read another customer's orders or cart.
- [ ] A non-admin account gets a 404 on `/admin` and sees only its own orders.
- [ ] The site works on a phone-sized screen.
- [ ] No secrets in the repo; `.env.example` lists every variable.

## 10. Risks

| Risk | Mitigation |
|---|---|
| Price tampering from the client | Server recomputes every total from database prices |
| An order saved but no email sent | Email failures are caught and logged, never rolled back; `email_sent_at` shows which confirmations went out |
| Overselling | `in_stock` is checked at order time; real stock counts are still an open item |
| Brevo rejects sends from an unverified sender | `BREVO_FROM_EMAIL` must stay a verified Brevo sender on an authenticated domain |
| Brevo's free sending quota is reached | Watch volume as the store grows; a hit quota means silent email loss |
| Google OAuth redirect mismatch | Keep the production URL in both Google's redirect URIs and Supabase's allowed URLs |
| Secrets exposed to the browser | Server-only env vars; never prefix a secret with `NEXT_PUBLIC_` |
