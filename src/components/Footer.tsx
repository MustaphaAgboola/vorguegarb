import Link from "next/link";

export function Footer() {
  const link =
    "text-[11px] font-medium uppercase tracking-label text-ink-muted transition-colors hover:text-ink";

  return (
    <footer className="mt-20 border-t border-ink-line">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-5 py-12 sm:flex-row sm:items-start sm:justify-between sm:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider">VogueGarb</p>
          <p className="mt-2 max-w-xs text-sm text-ink-muted">
            Bespoke Ankara, Aso Oke and ready-to-wear, made to order in Lagos.
          </p>
        </div>

        <nav className="flex flex-col gap-3" aria-label="Footer">
          <Link href="/shop" className={link}>
            Shop
          </Link>
          <Link href="/cart" className={link}>
            Cart
          </Link>
          <Link href="/orders" className={link}>
            My Orders
          </Link>
        </nav>
      </div>

      <div className="mx-auto flex max-w-[1400px] flex-col gap-1 border-t border-ink-line px-5 py-6 text-[11px] uppercase tracking-label text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>© {new Date().getFullYear()} VogueGarb · Lagos, Nigeria</p>
        <p>Pay on delivery</p>
      </div>
    </footer>
  );
}
