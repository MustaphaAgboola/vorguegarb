import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(4);

  const featured = (data ?? []) as Product[];

  return (
    <div className="space-y-16">
      <section className="overflow-hidden rounded-2xl bg-accent-light px-6 py-14 sm:px-12 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-dark">
          Lagos, Nigeria
        </p>
        <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight sm:text-5xl">
          Bespoke fashion, designed and styled for you.
        </h1>
        <p className="mt-4 max-w-xl text-stone-700">
          From Ankara gowns to Aso Oke agbada, every VogueGarb piece is made to
          order. Browse the collection, order in minutes, pay on delivery.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/shop" className="btn-accent">
            Shop the collection
          </Link>
          <Link href="/cart" className="btn-outline">
            View cart
          </Link>
        </div>
      </section>

      <section aria-labelledby="featured-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="featured-heading" className="text-xl font-semibold sm:text-2xl">
              Featured pieces
            </h2>
            <p className="mt-1 text-sm text-stone-600">Handpicked from the latest drop.</p>
          </div>
          <Link
            href="/shop"
            className="hidden text-sm text-accent hover:underline sm:inline"
          >
            View all
          </Link>
        </div>

        <div className="mt-6">
          {error ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              We couldn&apos;t load products right now. Please refresh the page.
            </p>
          ) : featured.length === 0 ? (
            <p className="rounded-xl border border-dashed border-stone-300 px-6 py-12 text-center text-sm text-stone-600">
              No products yet. Add some in Supabase to get started.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {featured.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 2} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
