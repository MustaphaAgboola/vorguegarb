"use client";

import { useState } from "react";
import { formatNaira } from "@/lib/format";
import type { Product } from "@/types";
import { AdminProductForm } from "./AdminProductForm";
import { AdminDeleteButton } from "./AdminDeleteButton";
import { ProductImage } from "./ProductImage";

/** One row of the admin collection list, which expands into an edit form. */
export function AdminProductRow({ product }: { product: Product }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="border-l-2 border-ink py-6 pl-5">
        <p className="eyebrow mb-5 text-ink">Editing {product.name}</p>
        <AdminProductForm
          product={product}
          onDone={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex items-center gap-5 py-5">
      <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden bg-paper-warm">
        <ProductImage src={product.image_url} alt={product.name} sizes="56px" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{product.name}</p>
        <p className="mt-1 text-[11px] uppercase tracking-label text-ink-muted">
          {product.category} · {formatNaira(product.price)}
          {product.in_stock ? "" : " · Sold out"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-[11px] font-medium uppercase tracking-label text-ink-muted transition-colors hover:text-ink"
        >
          Edit
        </button>
        <AdminDeleteButton id={product.id} name={product.name} />
      </div>
    </li>
  );
}
