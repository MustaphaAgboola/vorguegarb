"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export function CartBadge() {
  const { count, loading } = useCart();
  const label = `Cart, ${count} item${count === 1 ? "" : "s"}`;

  return (
    <Link
      href="/cart"
      aria-label={label}
      className="relative inline-flex items-center gap-1.5 rounded py-1 hover:text-accent"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 8h12l-1 12H7L6 8Zm3 0V6a3 3 0 0 1 6 0v2"
        />
      </svg>
      <span className="hidden sm:inline">Cart</span>
      {!loading && count > 0 ? (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-semibold text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
