import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client.
 * Uses the anon key only — safe to expose. RLS enforces access.
 * Cookie-based storage (the @supabase/ssr default) keeps the session in sync
 * with the server client so Server Components see the logged-in user.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
