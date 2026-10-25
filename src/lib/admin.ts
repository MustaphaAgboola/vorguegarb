/**
 * Admin gate. ADMIN_EMAILS is a server-only, comma-separated allowlist, so it
 * is never shipped to the browser. `products` has no insert/update RLS policy,
 * which means normal clients cannot write products at all — the admin routes
 * do their writes with the service role key behind this check.
 */
const allowlist = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return allowlist.includes(email.toLowerCase());
}
