# VogueGarb

A fashion design and styling shop for Lagos, Nigeria. Customers sign in with
Google, browse the collection, add pieces to a cart, check out, and receive a
Mailgun email confirmation. Orders are stored in Supabase Postgres.

Built for **HNG15, Lesson 2**. Requirements live in [`PRD.md`](./PRD.md); build
conventions live in [`AGENTS.md`](./AGENTS.md).

- **Live site:** _add your Netlify URL here_ (e.g. `https://voguegarb.netlify.app`)
- **Stack:** Next.js (App Router) + TypeScript, Tailwind CSS, Supabase
  (Postgres + Google auth), Mailgun, deployed on Netlify.

## Features

- Google sign-in / sign-out (Supabase Auth). Browsing is public.
- Home with featured pieces; shop grid with an optional category filter.
- Product detail with size selector, quantity, and add to cart.
- Cart in React context + `localStorage`, with a header badge.
- Checkout (login required) with delivery form and a live order summary.
- Orders saved atomically to Postgres; totals are recomputed **server-side**
  from real product prices (the client can never set the price).
- Mailgun confirmation email, sent after the order is saved. If email fails the
  order still succeeds (`email_sent_at` stays null).
- Order success page and a "My Orders" history. RLS means users only ever see
  their own orders.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev                  # http://localhost:3000
```

Other scripts:

```bash
npm run lint      # must pass
npm run build     # must pass before every deploy
```

## Environment variables

Set these in `.env.local` (never commit it). The same keys belong in the
Netlify UI for deploys.

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only. Admin tasks; not needed for the app flow |
| `MAILGUN_API_KEY` | Server only |
| `MAILGUN_DOMAIN` | Sandbox or verified domain |
| `MAILGUN_FROM` | e.g. `VogueGarb <orders@yourdomain>` |
| `MAILGUN_API_BASE` | `https://api.mailgun.net` (use `https://api.eu.mailgun.net` for EU) |
| `NEXT_PUBLIC_SITE_URL` | Public site URL, used to build auth redirect URLs |

Only values safe to expose get the `NEXT_PUBLIC_` prefix.

## Supabase setup

1. Create a project, then run `supabase/schema.sql` and `supabase/seed.sql` in
   the SQL Editor (open the file, copy its contents, paste, run).
   These create the `products`, `orders`, and `order_items` tables, enable RLS,
   and add the `create_order(...)` function that computes totals from the DB.
2. **Auth → Providers → Google:** enable it and paste the Client ID / Secret
   from Google Cloud Console.
3. **Auth → URL Configuration:**
   - Site URL: your production URL.
   - Redirect URLs: add `http://localhost:3000/**` and, for Netlify previews,
     `https://**--<your-site>.netlify.app/**`.

## Google Cloud Console

- Configure the OAuth consent screen (scopes: `openid`, `email`, `profile`).
- Create a **Web application** OAuth client.
- Authorized redirect URI must be the **Supabase** callback:
  `https://<project-ref>.supabase.co/auth/v1/callback` (not your site URL).

## Mailgun — creating the API credentials (next steps)

The app sends order confirmations from `src/lib/mailgun.ts` using the Mailgun
HTTP API. It needs three server-only values. Here is how to get them.

1. **Create an account** at [mailgun.com](https://www.mailgun.com/) (free signup).
   Every new account is provisioned with a **sandbox domain**
   (`sandbox….mailgun.org`) you can use for testing right away.
2. **Copy your API key.** In the dashboard go to **Account Settings → API Keys**
   and reveal the **Private API key**. For production, prefer a scoped
   **Domain Sending key** instead: **Sending → Domains → <your domain> →
   Domain Settings → Sending API keys → Add Sending Key**. A sending key can only
   send, so it limits exposure if leaked. → set as `MAILGUN_API_KEY`
   (shown only once when created, so save it immediately).
3. **Get your domain.** Open **Sending → Domains** and copy either your sandbox
   domain (`sandbox….mailgun.org`) or your verified custom domain.
   → set as `MAILGUN_DOMAIN`
4. **Set the sender.** `MAILGUN_FROM="VogueGarb <orders@YOUR_DOMAIN>"` — the
   address must be on the domain from step 3.
5. **Pick the right region.** US accounts use
   `MAILGUN_API_BASE=https://api.mailgun.net`. **EU accounts must use
   `https://api.eu.mailgun.net`** — the wrong base URL makes every request fail
   with a 401/404.
6. **On a sandbox domain, add your test inbox** under
   **Sending → Domains → <sandbox> → Setup → Authorized Recipients**. Sandbox
   domains only deliver to authorized addresses (up to 5), so an unlisted
   recipient silently never arrives.

Mailgun authenticates with HTTP Basic auth — username `api`, password = your
API key. That is exactly what `src/lib/mailgun.ts` sends. If a send fails, the
order still succeeds and `email_sent_at` stays `null`; the error is caught and
logged server-side (see AGENTS.md).

Verify it works by placing a test order and checking the Mailgun dashboard's
**Logs**, or watch your server logs for `Confirmation email failed:`.

## Deploying to Netlify

1. Connect the repo; Netlify detects Next.js automatically (build `npm run build`).
2. Add all environment variables, marking the secrets as "Contains secret".
3. Add the production URL to Supabase **Site URL / Redirect URLs**.

## Project structure

```
src/
  app/            pages + route handlers (see AGENTS.md for the full map)
  components/     UI components
  lib/            supabase clients, mailgun, cart helpers, formatting
  types/          shared TypeScript types
supabase/
  schema.sql      tables + RLS (run in the Supabase SQL Editor)
  seed.sql        sample VogueGarb products
```

## Notes

- Money is an integer in naira and formatted as `NGN`.
- Checkout is a mock "pay on delivery" flow — there is no payment processing.
- Product images in `supabase/seed.sql` point at `/public/products/*.jpg`. Drop your own
  photos there (or use Supabase Storage) — missing images fall back to a clean
  placeholder.
