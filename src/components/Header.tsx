import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Vogue<span className="text-accent">Garb</span>
        </Link>

        <nav className="flex items-center gap-3 text-sm sm:gap-5" aria-label="Main">
          <Link href="/shop" className="rounded py-1 hover:text-accent">
            Shop
          </Link>
          {user ? (
            <Link href="/orders" className="hidden rounded py-1 hover:text-accent sm:inline">
              My Orders
            </Link>
          ) : null}

          <CartBadge />

          {user ? (
            <div className="flex items-center gap-2">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name ? `${name}'s profile photo` : "Profile photo"}
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="grid h-7 w-7 place-items-center rounded-full bg-accent-light text-xs font-semibold text-accent-dark"
                >
                  {(name.charAt(0) || "V").toUpperCase()}
                </span>
              )}
              <span className="hidden max-w-[7rem] truncate md:inline">{name}</span>
              <SignOutButton />
            </div>
          ) : (
            <Link href="/login" className="btn-accent px-4 py-2 text-xs sm:text-sm">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
