"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Two-step delete. Avoids window.confirm so the flow stays inside the page,
 * and so a stray click can never remove a piece outright.
 */
export function AdminDeleteButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [arming, setArming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setError(json.error ?? "Could not delete.");
        setArming(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
      setArming(false);
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <span className="text-[11px] text-ink-muted">
        {error}{" "}
        <button type="button" onClick={() => setError(null)} className="underline">
          Dismiss
        </button>
      </span>
    );
  }

  if (!arming) {
    return (
      <button
        type="button"
        onClick={() => setArming(true)}
        className="text-[11px] font-medium uppercase tracking-label text-ink-muted transition-colors hover:text-ink"
      >
        Delete
      </button>
    );
  }

  return (
    <span className="flex items-center gap-3 text-[11px] uppercase tracking-label">
      <span className="text-ink-muted">Delete {name}?</span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        className="font-medium underline disabled:opacity-50"
      >
        {busy ? "Deleting…" : "Yes"}
      </button>
      <button
        type="button"
        onClick={() => setArming(false)}
        className="text-ink-muted underline"
      >
        No
      </button>
    </span>
  );
}
