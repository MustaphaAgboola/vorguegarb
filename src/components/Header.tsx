import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { CartBadge } from "./CartBadge";
import { SignOutButton } from "./SignOutButton";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const meta = user?.user_metadata ?? {};
  const name = (meta.full_name || meta.name || user?.email || "") as string;
  const avatarUrl = (meta.avatar_url || meta.picture || "") as string;
  const admin = isAdmin(user?.email);

  const navLink =
    "text-[11px] font-medium uppercase tracking-label text-ink-muted transition-colors hover:text-ink";

  return (
    <header className="sticky top-0 z-40 border-b border-ink-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="text-sm font-semibold uppercase tracking-wider text-ink"
        >
          VogueGarb
        </Link>

        <nav className="flex items-center gap-4 sm:gap-7" aria-label="Main">
          <Link href="/shop" className={navLink}>
            Shop
          </Link>
          {user ? (
            <Link href="/orders" className={navLink}>
              Orders
            </Link>
          ) : null}
          {admin ? (
            <Link href="/admin" className={navLink}>
              Admin
            </Link>
          ) : null}

          <CartBadge />

          {user ? (
            <div className="flex items-center gap-2.5">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name ? `${name}'s profile photo` : "Profile photo"}
                  width={26}
                  height={26}
                  className="h-[26px] w-[26px] rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="grid h-[26px] w-[26px] place-items-center rounded-full bg-paper-warm text-[10px] font-semibold uppercase text-ink"
                >
                  {(name.charAt(0) || "V").toUpperCase()}
                </span>
              )}
              <SignOutButton />
            </div>
          ) : (
            <Link href="/login" className={navLink}>
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
