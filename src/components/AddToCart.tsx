"use client";

import { useState } from "react";
import { MAX_QUANTITY, useCart } from "@/context/CartContext";

type Props = {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    image_url: string | null;
    sizes: string[];
    in_stock: boolean;
  };
};

export function AddToCart({ product }: Props) {
  const { add } = useCart();
  const sizes = product.sizes ?? [];
  const [size, setSize] = useState<string | null>(sizes[0] ?? null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  if (!product.in_stock) {
    return (
      <p className="bg-paper-warm px-4 py-3 text-sm text-ink-muted">
        This piece is currently sold out. Check back soon.
      </p>
    );
  }

  async function handleAdd() {
    // Guard against double submits while the request is in flight.
    if (adding) return;
    setAdding(true);
    const ok = await add(product.id, size, quantity);
    setAdding(false);
    if (!ok) return;
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="space-y-6">
      {sizes.length > 0 ? (
        <div>
          <span id="size-label" className="label">
            Size
          </span>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="size-label">
            {sizes.map((s) => {
              const active = size === s;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSize(s)}
                  className={`min-w-11 border px-3.5 py-2 text-[11px] font-medium uppercase tracking-label transition-colors ${
                    active
                      ? "border-ink bg-ink text-paper"
                      : "border-ink-line bg-paper hover:border-ink"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-ink-muted">Quantity</span>
        <div className="inline-flex items-center border border-ink-line">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="px-3 py-2 text-lg leading-none disabled:opacity-40"
          >
            −
          </button>
          <span aria-live="polite" className="min-w-8 text-center text-sm">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
            disabled={quantity >= MAX_QUANTITY}
            className="px-3 py-2 text-lg leading-none disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={adding}
        className="btn-accent w-full disabled:opacity-60 sm:w-auto"
      >
        {adding ? "Adding…" : added ? "Added to cart" : "Add to cart"}
      </button>

      <p aria-live="polite" className="sr-only">
        {added ? `${product.name} added to cart` : ""}
      </p>
    </div>
  );
}
