"use client";

import Link from "next/link";
import { formatNaira } from "@/lib/format";
import { MAX_QUANTITY, useCart } from "@/context/CartContext";
import { ProductImage } from "./ProductImage";

export function CartView() {
  const { items, subtotal, loading, remove, setQty } = useCart();

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading cart">
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-4 border border-ink-line bg-paper p-4">
            <div className="h-24 w-20 animate-pulse bg-paper-warm" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 animate-pulse bg-paper-warm" />
              <div className="h-4 w-1/4 animate-pulse bg-paper-warm" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-ink-line px-6 py-20 text-center">
        <p className="eyebrow">Nothing in the bag</p>
        <p className="mx-auto mt-3 max-w-sm text-sm text-ink-muted">
          Your cart is looking a little underdressed. Let&apos;s fix that.
        </p>
        <Link href="/shop" className="btn-accent mt-8">
          Shop the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <ul className="space-y-4">
        {items.map((item) => {
          const key = `${item.product_id}::${item.size}`;
          return (
            <li
              key={key}
              className="flex gap-4 border border-ink-line bg-paper p-4"
            >
              <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-paper-warm">
                <ProductImage
                  src={item.products.image_url}
                  alt={item.products.name}
                  sizes="80px"
                  className="object-cover"
                />
              </div>

              <div className="flex flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <Link
                    href={`/shop/${item.products.slug}`}
                    className="font-medium hover:text-accent"
                  >
                    {item.products.name}
                  </Link>
                  <p className="text-sm text-ink-muted">
                    {item.size ? `Size ${item.size} · ` : ""}
                    {formatNaira(item.products.price)}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="inline-flex items-center border border-ink-line">
                    <button
                      type="button"
                      aria-label={`Decrease quantity of ${item.products.name}`}
                      onClick={() => setQty(item.product_id, item.size, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="px-3 py-1.5 leading-none disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="min-w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label={`Increase quantity of ${item.products.name}`}
                      onClick={() => setQty(item.product_id, item.size, item.quantity + 1)}
                      disabled={item.quantity >= MAX_QUANTITY}
                      className="px-3 py-1.5 leading-none disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  <p className="w-24 text-right text-sm font-medium">
                    {formatNaira(item.products.price * item.quantity)}
                  </p>

                  <button
                    type="button"
                    onClick={() => remove(item.product_id, item.size)}
                    className="text-sm text-ink-muted underline-offset-2 hover:text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="h-fit border border-ink-line bg-paper p-6 lg:sticky lg:top-24">
        <h2 className="text-base font-semibold">Order summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Subtotal</dt>
            <dd className="font-medium">{formatNaira(subtotal)}</dd>
          </div>
          <div className="flex justify-between border-t border-ink-line pt-3 text-base">
            <dt className="font-semibold">Total</dt>
            <dd className="font-semibold">{formatNaira(subtotal)}</dd>
          </div>
        </dl>
        <Link href="/checkout" className="btn-accent mt-6 w-full">
          Proceed to checkout
        </Link>
        <Link
          href="/shop"
          className="mt-3 block text-center text-sm text-ink-muted underline-offset-2 hover:text-accent hover:underline"
        >
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
