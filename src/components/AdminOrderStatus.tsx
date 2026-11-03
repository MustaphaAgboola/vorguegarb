"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { orderStatusLabel } from "@/lib/format";
import { ORDER_STATUSES, type OrderStatus } from "@/types";

/**
 * Status picker for the admin orders view. Saves on an explicit button press
 * rather than on change, so arrowing through the select with a keyboard never
 * fires a write.
 */
export function AdminOrderStatus({ id, status }: { id: string; status: OrderStatus }) {
  const router = useRouter();
  const [value, setValue] = useState<OrderStatus>(status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (busy || value === status) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: value }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setError(json.error ?? "Could not update.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor={`status-${id}`} className="sr-only">
        Order status
      </label>
      <select
        id={`status-${id}`}
        value={value}
        onChange={(e) => setValue(e.target.value as OrderStatus)}
        disabled={busy}
        className="border border-ink-line bg-paper px-2 py-1 text-[11px] uppercase tracking-label disabled:opacity-50"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {orderStatusLabel[s]}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleSave}
        disabled={busy || value === status}
        className="text-[11px] font-medium uppercase tracking-label underline disabled:no-underline disabled:opacity-40"
      >
        {busy ? "Saving…" : "Update"}
      </button>
      {error ? (
        <span role="alert" className="text-[11px] text-red-700">
          {error}
        </span>
      ) : null}
    </div>
  );
}
