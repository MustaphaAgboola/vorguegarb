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

There is also a quick CLI check that sends a test and reports the real
delivery outcome (including whether Gmail filed it as spam):

```bash
npm run test:mailgun -- you@example.com
```

### Why sandbox email lands in spam

A sandbox domain (`sandbox….mailgun.org`) has no sending reputation and is not
DMARC-aligned to a domain you own, so providers like Gmail **quarantine** it.
The Mailgun event log shows `delivered` with `250 … DMARC:Quarantine`, and the
message appears in **Spam**, not the inbox. The app is working correctly in that
case — this is a deliverability setting, not a bug.

To reach the inbox, verify a **custom domain** you own in Mailgun and update the
env vars:

1. **Sending → Domains → Add Domain** (e.g. `mg.yourdomain.com`).
2. Add the DNS records Mailgun shows for that domain:
   - `TXT` on the domain: `v=spf1 include:mailgun.org ~all`
   - `TXT` on `k1._domainkey.<domain>`: the DKIM `k=rsa; p=…` value from the dashboard
   - `MX` on the domain: `mxa.mailgun.org` and `mxb.mailgun.org` (priority 10)
   - `CNAME` on `email.<domain>`: `mailgun.org` (optional, click/open tracking)
   - `TXT` on `_dmarc.<domain>`: `v=DMARC1; p=none;` (recommended)
3. Wait for the domain to show **Verified** (DNS can take minutes to a few hours).
4. Point the app at it and restart the dev server (Next.js reads env at startup):
   ```
   MAILGUN_DOMAIN=mg.yourdomain.com
   MAILGUN_FROM="VogueGarb <orders@mg.yourdomain.com>"
   ```

Until a custom domain is verified, sandbox mail will keep going to spam. If you
only need a sandbox for a demo, every recipient must still be listed under
**Sending → Domains → <sandbox> → Authorized Recipients**.

### Getting a free sending domain

You need to control DNS for a domain (Mailgun verifies ownership with `TXT`/`CNAME`
records). Free options that work, best first:

- **GitHub Student Developer Pack** — best value, and it works for Nigerian
  students (verify with a student ID, biodata page, or enrollment letter).
  Sign up at [education.github.com/pack](https://education.github.com/pack), then claim:
  - **Name.com** — 1 year free domain (25+ extensions incl. `.dev`, `.app`, `.live`)
  - **Namecheap** — 1 year free `.me` domain (+ free SSL)
  - **Tech Domains** — one `.TECH` domain free for 1 year
  - Bonus: the pack also includes **Mailgun: 20,000 emails/month for 12 months**
    (much better than the free plan's 100/day).

  All three registrars give full DNS control, so SPF/DKIM/DMARC can be added.
  The domain is free for the **first year only**; renewals cost money.
- **Free subdomains** — technically fine for *sending*, which needs only `TXT`
  (SPF + DKIM) and an optional `CNAME`. `MX` is only for *receiving* and is not
  required for order confirmations. Options: [is-a.dev](https://www.is-a.dev/)
  (register via GitHub PR), `FreeDNS` at afraid.org, or DuckDNS. Caveat: you
  share the parent domain's reputation with strangers, so mail may still be
  flagged as spam.
- **Cheap promo TLDs** (not free, but ~$1–5 for the first year): `.xyz`, `.top`,
  `.online`, `.site`. The free Mailgun plan already allows **1 custom sending
  domain**, so this is enough.

Whatever you pick, add the Mailgun records for that domain, wait for **Verified**,
then set `MAILGUN_DOMAIN` / `MAILGUN_FROM` and restart.

## Deploying to Netlify

The repo is already set up for Netlify: `netlify.toml` pins `npm run build`,
publishes `.next`, and sets Node 22. Netlify auto-installs the Next.js (OpenNext)
adapter — you do **not** need to add a plugin entry.

### 1. Import the project

1. Push the code to GitHub.
2. In Netlify: **Add new site → Import an existing project → GitHub**, then pick
   the `vorguegarb` repo and the `main` branch.
3. Leave the detected build settings as-is (command `npm run build`, publish
   `.next`, Node 22 from `netlify.toml`).

### 2. Add environment variables

In **Site configuration → Environment variables**, add every key from
`.env.example` (scope: all deploy contexts). Mark the secrets as "Contains
secret":

| Variable | Value | Secret? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | no |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | no |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key (not used by the app flow) | **yes** |
| `MAILGUN_API_KEY` | Mailgun private/sending key | **yes** |
| `MAILGUN_DOMAIN` | `sandbox….mailgun.org` or a verified domain | no |
| `MAILGUN_FROM` | `VogueGarb <orders@YOUR_DOMAIN>` | no |
| `MAILGUN_API_BASE` | `https://api.mailgun.net` | no |
| `NEXT_PUBLIC_SITE_URL` | your Netlify URL | no |

> `NEXT_PUBLIC_*` values are inlined into the client bundle **at build time**.
> Set them before the first deploy, and **redeploy** whenever you change one.

### 3. Deploy

Click **Deploy site** (or just push to `main` — Netlify rebuilds on every push).
When the build finishes, copy the site URL (e.g.
`https://voguegarb-xyz.netlify.app`) from the site overview.

### 4. Point Supabase at the live URL

In Supabase **Authentication → URL Configuration**:

- **Site URL:** your Netlify URL.
- **Redirect URLs:** add all of these:
  - `http://localhost:3000/**`
  - `https://<your-site>.netlify.app/**`
  - `https://**--<your-site>.netlify.app/**` (preview deploys)

The Google Cloud Console redirect URI stays the **Supabase** callback
(`https://<project-ref>.supabase.co/auth/v1/callback`) — it does not change.

### 5. Verify

- Sign in with Google on the live URL → you land back on `/shop`.
- Place a test order → a row appears in Supabase and the Mailgun log shows the send.
- Sign in with a second account → it cannot see the first account's orders.
- Run `npm run test:mailgun -- you@example.com` locally to confirm deliverability.

> Auth redirects use `window.location.origin`, so sign-in works on any domain
> without extra code. `NEXT_PUBLIC_SITE_URL` is documented for completeness but
> is not read by the current code.

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
