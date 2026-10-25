# VogueGarb

## Overview

VogueGarb is a fashion design and styling store for Lagos, Nigeria. It is a
**Next.js website** plus an **Expo mobile app** that share **one Supabase
backend** — the same Google login, the same products, and the same cart on both
platforms. Customers sign in with Google, browse the collection, add pieces to
a cart, check out, and receive a Mailgun email confirmation.

Built for **HNG15**. Requirements live in [`PRD.md`](./PRD.md); build
conventions live in [`AGENTS.md`](./AGENTS.md).

## Live website

<!-- TODO: fill in the Netlify URL after the deploy finishes -->
**URL:** `https://____________________.netlify.app`

## Tech stack

| Platform | Technologies |
|---|---|
| Web | Next.js (App Router) + TypeScript, Tailwind CSS, deployed on Netlify |
| Mobile | Expo / React Native + TypeScript, expo-router, built with EAS (Android APK) |
| Shared backend | Supabase — Postgres, Google Auth, and Realtime (`cart_items`) |
| Email | Mailgun HTTP API, sent server-side from the web app |

## Web setup

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev                  # http://localhost:3000
```

Environment variables (`.env.local` — never committed; see `.env.example`):

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only; admin tasks |
| `MAILGUN_API_KEY` | Server only |
| `MAILGUN_DOMAIN` | Sandbox or verified domain |
| `MAILGUN_FROM` | e.g. `VogueGarb <orders@yourdomain.com>` |
| `MAILGUN_API_BASE` | Optional; `https://api.mailgun.net` (EU accounts: `https://api.eu.mailgun.net`) |
| `NEXT_PUBLIC_SITE_URL` | Public site URL, used in auth redirect URLs |
| `ADMIN_EMAILS` | Server only; comma-separated Google addresses allowed into `/admin` |

One-time Supabase setup: run `supabase/schema.sql` and `supabase/seed.sql` in
the SQL Editor, enable the Google provider (Auth → Providers → Google), and add
redirect URLs (Site URL, `http://localhost:3000/**`, and your Netlify URLs).

Scripts: `npm run lint` and `npm run build` must both pass before committing.

**Deploy (Netlify):** the repo deploys with `netlify.toml`
(`npm run build`, publish `.next`, Node 22). Set the env vars above in the
Netlify UI — mark the service role key and Mailgun key as secrets. If the
secret scanner flags `MAILGUN_API_BASE`, see the `SECRETS_SCAN_OMIT_KEYS`
note in `netlify.toml`.

## Mobile setup

```bash
cd mobile
npm install
cp .env.example .env   # then fill in the values below
npx expo start         # scan the QR code with the Expo Go app
```

Environment variables (`mobile/.env` — git-ignored; `mobile/.env.example`
lists the same names with empty values):

| Variable | Notes |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | The same Supabase project as the website |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Anon key only — never the service role key |
| `EXPO_PUBLIC_API_URL` | Base URL of the deployed website (e.g. `https://vorguegarb.netlify.app`) |

`mobile/eas.json` carries the same three public values in the `preview`
profile's `env` block so EAS builds get them too.

## How it works

- **One login on both platforms.** The website and the mobile app use the same
  Supabase Google OAuth flow. The website returns to the page you came from;
  the mobile app builds its callback with `makeRedirectUri()`, so Google
  returns to the app's `voguegarb://` scheme (configured in `mobile/app.json`).
- **One cart, synced live.** The cart is stored in the `cart_items` table.
  Every change is broadcast over **Supabase Realtime**, so adding an item on
  the website appears in the mobile app instantly (and the other way around).
  Row Level Security means each user only ever sees their own cart.
- **Mobile drives the web API.** The mobile app calls the website's
  `/api/cart` and `/api/orders` endpoints with the Supabase session token as an
  `Authorization: Bearer <token>` header, so cart mutations and orders run
  through the exact same server code (and server-side total calculation and
  Mailgun email) as the website.

## Admin

`/admin` lets the store owner add and remove products, with photos uploaded
straight to Supabase Storage. Access is controlled by `ADMIN_EMAILS`, a
server-only comma-separated allowlist:

```
ADMIN_EMAILS=owner@gmail.com,second.owner@gmail.com
```

Signed-out visitors are redirected to login; signed-in non-admins get a 404, so
the page's existence isn't advertised. Writes go through the service-role key
on the server behind that check — `products` has no insert or update RLS
policy, so no browser client can write products regardless of who is signed in.

Photos land in the public `product-images` Storage bucket, created by
`supabase/schema.sql`. Re-run that file if you set the project up before the
admin page existed.

## Building the APK

The `preview` profile in `mobile/eas.json` builds an internal Android APK
(`distribution: "internal"`, `android.buildType: "apk"`) with the three public
env values baked in.

```bash
cd mobile
eas login
eas build -p android --profile preview
```

When the build finishes, EAS prints a download link for the `.apk`; you can
also find it under **Builds** in the Expo dashboard.

## APK download link

<!-- TODO: paste the EAS build download link here -->
**URL:** `https://____________________`

## Demo video link

<!-- TODO: paste your demo video link here -->
**URL:** `https://____________________`

## Testing notes

- Google login verified on a **physical Android device**: sign-in completes
  and returns to the app through the `voguegarb://` redirect.
- Cart sync verified on a **physical Android device**: an item added on the
  website shows up in the mobile app in real time via Supabase Realtime, and
  the reverse also works.

## Project structure

```
src/        Next.js web app (see AGENTS.md for the full map)
mobile/     Expo app — src/app screens, src/lib, src/context
supabase/   schema.sql (tables + RLS) and seed.sql (sample products)
```

## Notes

- Money is an integer in naira, formatted as `NGN` with `Intl.NumberFormat`.
- Checkout is a mock "pay on delivery" flow — there is no payment processing.
- Never commit `.env` / `.env.local` files; the committed `.env.example`
  files carry variable names with empty values only.

