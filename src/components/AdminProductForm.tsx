"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type Status = { kind: "idle" } | { kind: "error"; message: string } | { kind: "done"; name: string };

export function AdminProductForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [preview, setPreview] = useState<string | null>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "");

    setSubmitting(true);
    setStatus({ kind: "idle" });

    try {
      const res = await fetch("/api/admin/products", { method: "POST", body: data });
      const json = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setStatus({ kind: "error", message: json.error ?? "Could not save the product." });
        return;
      }

      form.reset();
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });
      setStatus({ kind: "done", name });
      router.refresh();
    } catch {
      setStatus({ kind: "error", message: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="label">
            Name
          </label>
          <input id="name" name="name" required minLength={2} maxLength={120} className="field" />
        </div>

        <div>
          <label htmlFor="price" className="label">
            Price (₦)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            required
            min={0}
            step={1}
            inputMode="numeric"
            placeholder="85000"
            className="field"
          />
        </div>

        <div>
          <label htmlFor="category" className="label">
            Category
          </label>
          <input
            id="category"
            name="category"
            defaultValue="general"
            maxLength={60}
            placeholder="ankara"
            className="field"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="sizes" className="label">
            Sizes <span className="normal-case tracking-normal">(comma separated)</span>
          </label>
          <input id="sizes" name="sizes" placeholder="S, M, L, XL" className="field" />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className="label">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={2000}
            className="field resize-y"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="image" className="label">
            Photo
          </label>
          <input
            id="image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleFileChange}
            className="block w-full text-sm text-ink-muted file:mr-4 file:border file:border-ink file:bg-paper file:px-4 file:py-2 file:text-[11px] file:font-medium file:uppercase file:tracking-label file:text-ink hover:file:bg-paper-warm"
          />
          <p className="mt-2 text-xs text-ink-muted">JPEG, PNG, WebP or AVIF · 5MB maximum.</p>

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
          <label htmlFor="inStock" className="label">
            Availability
          </label>
          <select id="inStock" name="inStock" defaultValue="true" className="field">
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

      <button type="submit" disabled={submitting} className="btn-accent w-full sm:w-auto">
        {submitting ? "Saving…" : "Add product"}
      </button>
    </form>
  );
}
