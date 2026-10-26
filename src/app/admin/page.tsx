import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { AdminProductForm } from "@/components/AdminProductForm";
import { AdminProductRow } from "@/components/AdminProductRow";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");
  // 404 rather than 403: a non-admin shouldn't learn the page exists.
  if (!isAdmin(user.email)) notFound();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  const products = (data ?? []) as Product[];

  // Derived from the rows already fetched, so the dropdown costs no extra query.
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b)
  );

  return (
    <div className="space-y-16">
      <div className="border-b border-ink-line pb-4">
        <h1 className="eyebrow">Admin</h1>
        <p className="mt-3 text-sm text-ink-muted">
          Signed in as {user.email}. Changes go live immediately.
        </p>
      </div>

      <section aria-labelledby="add-heading" className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <h2 id="add-heading" className="eyebrow mb-6">
            Add a piece
          </h2>
          <AdminProductForm categories={categories} />
        </div>

        <aside className="h-fit border border-ink-line p-6 text-sm text-ink-muted lg:sticky lg:top-24">
          <p className="eyebrow mb-3 text-ink">Notes</p>
          <ul className="space-y-2.5">
            <li>Price is whole naira — no kobo, no separators.</li>
            <li>The URL slug is generated from the name, so names must be unique.</li>
            <li>
              Renaming a piece keeps its original web address, so links you&apos;ve already
              shared keep working.
            </li>
            <li>Editing without choosing a new photo keeps the current one.</li>
            <li>Leave sizes empty for one-size pieces.</li>
            <li>A piece that already appears in an order can&apos;t be deleted — mark it sold out.</li>
          </ul>
        </aside>
      </section>

      <section aria-labelledby="list-heading">
        <div className="flex items-baseline justify-between gap-4 border-b border-ink-line pb-4">
          <h2 id="list-heading" className="eyebrow">
            Collection
          </h2>
          <p className="eyebrow">
            {products.length} {products.length === 1 ? "piece" : "pieces"}
          </p>
        </div>

        {error ? (
          <p className="mt-8 border border-ink-line px-4 py-3 text-sm text-ink-muted">
            We couldn&apos;t load the collection right now. Please refresh.
          </p>
        ) : products.length === 0 ? (
          <p className="mt-8 border border-dashed border-ink-line px-6 py-16 text-center text-sm text-ink-muted">
            No products yet. Add your first piece above.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-ink-line">
            {products.map((product) => (
              <AdminProductRow key={product.id} product={product} categories={categories} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
