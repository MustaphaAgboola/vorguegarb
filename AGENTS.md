# AGENTS.md

Instructions for AI coding agents working on **VogueGarb**, a fashion design and styling online shop (Lagos, Nigeria). Read `PRD.md` first for requirements. This file covers how to build.

## Project summary

VogueGarb's real online store, live at https://voguegarb.app and taking actual customer orders. A Next.js website plus an Expo app in `mobile/` over one Supabase backend: Google sign-in, a cart synced across both platforms, checkout, orders in Postgres, and Brevo emails to the customer and the store.

Because real orders flow through this, correctness and customer privacy come before speed. Favor working and simple over clever, and prefer a boring fix on a path that touches orders, money or auth.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase: Postgres + Auth (Google provider), using `@supabase/ssr`
- Brevo via its transactional email API (server-side only)
- Deployed on Netlify (config in `netlify.toml`)

## Commands

```bash
npm install        # install deps
npm run dev        # local dev server (http://localhost:3000)
npm run build      # production build; must pass before every deploy
npm run lint       # lint; must pass before committing
npm run test:email you@example.com   # send a real test email via Brevo
```

The site deploys automatically from `main`, so a push to `main` goes straight to customers.

## Folder structure

```
src/
  middleware.ts               # Refreshes the Supabase session cookie
  app/
    page.tsx                  # Home
    shop/page.tsx             # Product grid + category filter
    shop/[slug]/page.tsx      # Product detail
    cart/page.tsx
    checkout/page.tsx         # Protected
    orders/page.tsx           # Protected: My Orders, or all orders for an admin
    orders/[id]/success/      # Order success page
    login/page.tsx
    admin/page.tsx            # Protected by ADMIN_EMAILS; 404 for everyone else
    auth/callback/route.ts    # OAuth callback
    api/orders/route.ts       # Create order + both emails
    api/cart/route.ts         # Cart mutations (also used by the mobile app)
    api/admin/products/route.ts  # Product writes behind the admin check
  components/                 # UI components
  context/CartContext.tsx     # Client cart state over cart_items + Realtime
  lib/
    supabase/client.ts        # Browser client
    supabase/server.ts        # Server client (cookies)
    supabase/admin.ts         # Service-role client — server only, admin paths
    admin.ts                  # adminEmails, isAdmin()
    email.ts                  # sendOrderConfirmation(), sendAdminOrderNotification()
    format.ts                 # Money and date formatting
  types/                      # Shared TS types
supabase/
  schema.sql                  # Tables + RLS policies + create_order()
  seed.sql                    # Sample VogueGarb products
mobile/                       # Expo app; has its own AGENTS.md — read it before
                              # touching anything in there
```

## Environment variables

Define in `.env.local` (never commit). Keep `.env.example` updated with the same keys and empty values.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server only, use sparingly
BREVO_API_KEY=                  # server only
BREVO_FROM_EMAIL=               # verified Brevo sender, e.g. orders@YOUR_DOMAIN
BREVO_FROM_NAME=VogueGarb       # optional
NEXT_PUBLIC_SITE_URL=
ADMIN_EMAILS=                   # server only; comma-separated Google addresses
```

Production values live in the Netlify UI (`netlify env:list`), set for all contexts. Changing one there needs a redeploy before it reaches the live site.

Only variables that are safe to expose get the `NEXT_PUBLIC_` prefix. Secrets must never be imported into client components.

## Rules for agents

### Security (non-negotiable)
1. Never commit secrets or `.env*` files (except `.env.example`).
2. Never trust prices or totals from the client. In `/api/orders`, fetch product prices from the database and compute the total server-side.
3. Always get the user from the server-side Supabase session. Never accept a `user_id` from the request body.
4. Keep RLS enabled on `orders`, `order_items` and `cart_items`. Customers may only read and insert their own rows. `products` is public read with no insert or update policy at all — product writes go through the service role behind the admin check.
5. Do not use the service role key in client code or where the anon key plus RLS is enough.
6. `ADMIN_EMAILS` is server-only and must never gain a `NEXT_PUBLIC_` prefix. Gate every admin path on `isAdmin()` from `src/lib/admin.ts` — both the page and its API route, since a page check alone leaves the route open.

### Orders and email
1. Save the order and its items first, then send the email.
2. A Brevo failure must **not** fail the order. Catch the error, log it, and leave `email_sent_at` null. On success, set `email_sent_at`.
3. Snapshot `name` and `unit_price` into `order_items` at purchase time.
4. Prevent double submits: disable the button while the request is in flight.
5. Brevo rejects sends from an unverified sender. If emails don't arrive, check that `BREVO_FROM_EMAIL` is verified under Senders, Domains & Dedicated IPs first.
6. Each order sends two emails: the customer confirmation and a separate store notification to `ADMIN_EMAILS`. Each goes in its own try block so one failure cannot swallow the other, and `email_sent_at` tracks the customer confirmation only.

### Code style
- TypeScript strict. No `any` unless unavoidable and commented.
- Server Components by default. Add `"use client"` only for interactivity (cart, forms).
- Validate input on the server (e.g. with `zod`) as well as the client.
- Small, focused components. Co-locate simple helpers.
- Handle loading, empty, and error states on every data-driven page.
- Money is stored as an integer in naira. Format with `Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })`.

### UI
- Mobile-first, clean, fashion-brand feel. Plenty of whitespace, strong product imagery, one accent color.
- Use `next/image` with explicit sizes. Provide alt text on every image.
- Buttons and inputs must be keyboard accessible with visible focus.

### Scope discipline
- `PRD.md` section 3 describes what exists; section 4 lists what is deliberately absent. Do the task asked, not the adjacent improvements you notice.
- Adding a whole new customer-facing surface, or anything that takes money, changes the order lifecycle or touches stock, is the owner's decision. Ask first, then update `PRD.md` in the same change.
- If `PRD.md` and the code disagree, the code is the truth about today — say so and fix the document.

## Auth setup notes

- Google provider is configured in Supabase (Auth, Providers, Google) using the OAuth client from Google Cloud Console.
- Google authorized redirect URI = the **Supabase** callback URL (`https://<project-ref>.supabase.co/auth/v1/callback`).
- Supabase Site URL and Redirect URLs must include `http://localhost:3000/**`, the live site `https://voguegarb.app/**`, and the Netlify preview pattern `https://**--vorguegarb.netlify.app/**`.
- After login, redirect to the page the user came from (default `/shop`). Checkout redirects unauthenticated users to login.

## Definition of done (per task)

- [ ] Works locally and on the deployed URL
- [ ] `npm run lint` and `npm run build` pass
- [ ] No secrets in the diff
- [ ] Loading, empty, and error states handled
- [ ] Behavior matches the relevant section of `PRD.md`

## Before changing anything customers touch

Pushing to `main` deploys to the live store, so for work on auth, the cart,
checkout, orders or email:

- [ ] Google login still works on the live site
- [ ] A real test order: the row appears in Supabase with the right total, the
      customer's email arrives, and the store's "New order" email reaches every
      `ADMIN_EMAILS` address
- [ ] A second, non-admin account cannot see the first account's orders or cart
- [ ] `.env.example` still lists every variable, and no real keys are committed

If a Netlify variable changed, redeploy — existing deploys keep the old values.
