"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/types";

type Status = { kind: "idle" } | { kind: "error"; message: string } | { kind: "done"; name: string };

/** Sentinel for the "add a category that doesn't exist yet" option. */
const NEW_CATEGORY = "__new__";

type Props = {
  /** Present in edit mode; omitted when adding a new piece. */
  product?: Product;
  /** Categories already in use, for the dropdown. */
  categories: string[];
  /** Called after a successful edit, so the row can close itself. */
  onDone?: () => void;
  onCancel?: () => void;
};

export function AdminProductForm({ product, categories, onDone, onCancel }: Props) {
  const router = useRouter();
  const editing = Boolean(product);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [preview, setPreview] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);

  // "general" is the server-side default, so it is always offered.
  const options = Array.from(new Set(["general", ...categories])).sort((a, b) =>
    a.localeCompare(b)
  );

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  function clearPreview() {
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "");
    if (product) data.set("id", product.id);

    setSubmitting(true);
    setStatus({ kind: "idle" });

    try {
      const res = await fetch("/api/admin/products", {
        method: editing ? "PATCH" : "POST",
        body: data,
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setStatus({
          kind: "error",
          message: json.error ?? "Could not save the product.",
        });
        return;
      }

      clearPreview();
      router.refresh();

      if (editing) {
        onDone?.();
        return;
      }
      form.reset();
      // form.reset() restores the select, so drop the extra input with it.
      setAddingCategory(false);
      setStatus({ kind: "done", name });
    } catch {
      setStatus({ kind: "error", message: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={`name-${product?.id ?? "new"}`} className="label">
            Name
          </label>
          <input
            id={`name-${product?.id ?? "new"}`}
            name="name"
            required
            minLength={2}
            maxLength={120}
            defaultValue={product?.name}
            className="field"
          />
          {editing ? (
            <p className="mt-2 text-xs text-ink-muted">
              The web address stays /shop/{product!.slug} even if you rename the piece, so
              existing links keep working.
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor={`price-${product?.id ?? "new"}`} className="label">
            Price (₦)
          </label>
          <input
            id={`price-${product?.id ?? "new"}`}
            name="price"
            type="number"
            required
            min={0}
            step={1}
            inputMode="numeric"
            placeholder="85000"
            defaultValue={product?.price}
            className="field"
          />
        </div>

        <div>
          <label htmlFor={`category-${product?.id ?? "new"}`} className="label">
            Category
          </label>
          <select
            id={`category-${product?.id ?? "new"}`}
            // Only carries the value while an existing category is selected;
            // the text input below takes over the field name otherwise.
            name={addingCategory ? undefined : "category"}
            defaultValue={product?.category ?? "general"}
            onChange={(e) => setAddingCategory(e.target.value === NEW_CATEGORY)}
            className="field capitalize"
          >
            {options.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c}
              </option>
            ))}
            <option value={NEW_CATEGORY}>+ New category…</option>
          </select>

          {addingCategory ? (
            <input
              name="category"
              required
              autoFocus
              minLength={2}
              maxLength={60}
              placeholder="e.g. agbada"
              aria-label="New category name"
              className="field mt-2"
            />
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor={`sizes-${product?.id ?? "new"}`} className="label">
            Sizes <span className="normal-case tracking-normal">(comma separated)</span>
          </label>
          <input
            id={`sizes-${product?.id ?? "new"}`}
            name="sizes"
            placeholder="S, M, L, XL"
            defaultValue={product?.sizes?.join(", ")}
            className="field"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor={`description-${product?.id ?? "new"}`} className="label">
            Description
          </label>
          <textarea
            id={`description-${product?.id ?? "new"}`}
            name="description"
            rows={4}
            maxLength={2000}
            defaultValue={product?.description}
            className="field resize-y"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor={`image-${product?.id ?? "new"}`} className="label">
            {editing ? "Replace photo" : "Photo"}
          </label>
          <input
            id={`image-${product?.id ?? "new"}`}
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleFileChange}
            className="block w-full text-sm text-ink-muted file:mr-4 file:border file:border-ink file:bg-paper file:px-4 file:py-2 file:text-[11px] file:font-medium file:uppercase file:tracking-label file:text-ink hover:file:bg-paper-warm"
          />
          <p className="mt-2 text-xs text-ink-muted">
            JPEG, PNG, WebP or AVIF · 5MB maximum.
            {editing ? " Leave empty to keep the current photo." : ""}
          </p>

          {preview ? (
            <div className="mt-4 w-32">
              {/* Local object URL, so next/image optimisation does not apply. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Selected product photo preview"
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor={`inStock-${product?.id ?? "new"}`} className="label">
            Availability
          </label>
          <select
            id={`inStock-${product?.id ?? "new"}`}
            name="inStock"
            defaultValue={product ? String(product.in_stock) : "true"}
            className="field"
          >
            <option value="true">In stock</option>
            <option value="false">Sold out</option>
          </select>
        </div>
      </div>

      {status.kind === "error" ? (
        <p role="alert" className="border border-ink px-4 py-3 text-sm">
          {status.message}
        </p>
      ) : null}
      {status.kind === "done" ? (
        <p role="status" className="border border-ink-line bg-paper-warm px-4 py-3 text-sm">
          “{status.name}” added to the collection.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={submitting} className="btn-accent w-full sm:w-auto">
          {submitting ? "Saving…" : editing ? "Save changes" : "Add product"}
        </button>
        {editing ? (
          <button
            type="button"
            onClick={() => {
              clearPreview();
              onCancel?.();
            }}
            disabled={submitting}
            className="btn-outline w-full sm:w-auto"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
