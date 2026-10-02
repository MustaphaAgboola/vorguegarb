# AGENTS.md

Instructions for AI coding agents working on **VogueGarb**, a fashion design and styling online shop (Lagos, Nigeria). Read `PRD.md` first for requirements. This file covers how to build.

## Project summary

Next.js shop with Google sign-in, cart, checkout, orders stored in Supabase Postgres, and Mailgun confirmation emails. HNG15 Lesson 2. **Hard deadline: Friday 11:59 PM WAT.** Favor working and simple over clever.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase: Postgres + Auth (Google provider), using `@supabase/ssr`
- Mailgun via its HTTP API (server-side only)
- Deployed on Netlify (config in `netlify.toml`)

## Commands

```bash
npm install        # install deps
npm run dev        # local dev server (http://localhost:3000)
npm run build      # production build; must pass before every deploy
npm run lint       # lint; must pass before committing
```

## Folder structure

```
src/
  app/
    page.tsx                  # Home
    shop/page.tsx             # Product grid
    shop/[slug]/page.tsx      # Product detail
    cart/page.tsx
    checkout/page.tsx         # Protected
    orders/page.tsx           # Protected: My Orders
    orders/[id]/success/      # Order success page
    auth/callback/route.ts    # OAuth callback
    api/orders/route.ts       # Create order + send email
  components/                 # UI components
  lib/
    supabase/client.ts        # Browser client
    supabase/server.ts        # Server client (cookies)
    mailgun.ts                # sendOrderConfirmation()
    cart.ts                   # Cart state helpers
  types/                      # Shared TS types
supabase/
  schema.sql                  # Tables + RLS policies
  seed.sql                    # Sample VogueGarb products
```

## Environment variables

Define in `.env.local` (never commit). Keep `.env.example` updated with the same keys and empty values.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server only, use sparingly
MAILGUN_API_KEY=                # server only
MAILGUN_DOMAIN=                 # sandbox or verified domain
MAILGUN_FROM="VogueGarb <orders@YOUR_DOMAIN>"
MAILGUN_API_BASE=https://api.mailgun.net   # use https://api.eu.mailgun.net for EU accounts
NEXT_PUBLIC_SITE_URL=
```

Only variables that are safe to expose get the `NEXT_PUBLIC_` prefix. Secrets must never be imported into client components.

## Rules for agents

### Security (non-negotiable)
1. Never commit secrets or `.env*` files (except `.env.example`).
2. Never trust prices or totals from the client. In `/api/orders`, fetch product prices from the database and compute the total server-side.
3. Always get the user from the server-side Supabase session. Never accept a `user_id` from the request body.
4. Keep RLS enabled on `orders` and `order_items`. Users may only read and insert their own rows. `products` is public read-only.
5. Do not use the service role key in client code or where the anon key plus RLS is enough.

### Orders and email
1. Save the order and its items first, then send the email.
2. A Mailgun failure must **not** fail the order. Catch the error, log it, and leave `email_sent_at` null. On success, set `email_sent_at`.
3. Snapshot `name` and `unit_price` into `order_items` at purchase time.
4. Prevent double submits: disable the button while the request is in flight.
5. Mailgun sandbox domains only deliver to authorized recipients. If emails don't arrive, check that first.

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
- Build only what `PRD.md` lists. Do **not** add payments, admin panels, discount codes, or reviews.
- If time is short, cut in this order: category filter, My Orders page, cart persistence. Never cut: Google auth, checkout, database saving, email.

## Auth setup notes

- Google provider is configured in Supabase (Auth, Providers, Google) using the OAuth client from Google Cloud Console.
- Google authorized redirect URI = the **Supabase** callback URL (`https://<project-ref>.supabase.co/auth/v1/callback`).
- Supabase Site URL and Redirect URLs must include both `http://localhost:3000/**` and the production Netlify URL, plus the preview pattern `https://**--<your-site>.netlify.app/**`.
- After login, redirect to the page the user came from (default `/shop`). Checkout redirects unauthenticated users to login.

## Definition of done (per task)

- [ ] Works locally and on the deployed URL
- [ ] `npm run lint` and `npm run build` pass
- [ ] No secrets in the diff
- [ ] Loading, empty, and error states handled
- [ ] Behavior matches the relevant section of `PRD.md`

## Final pre-submission checklist

- [ ] Google login works on the live site
- [ ] Place a real test order: row appears in Supabase, email arrives
- [ ] A second account cannot see the first account's orders
- [ ] Repo is public, README has live URL, setup steps, and env var list
- [ ] `.env.example` present, no real keys committed
