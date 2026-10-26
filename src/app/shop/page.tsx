import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/ProductCard";
import { CategoryFilter } from "@/components/CategoryFilter";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Shop" };

type Props = { searchParams: Promise<{ category?: string }> };

function ProductGridSkeleton() {
  return (
    <div
      className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <div className="aspect-[4/5] w-full animate-pulse bg-paper-warm" />
          <div className="h-3 w-3/4 animate-pulse bg-paper-warm" />
        </div>
      ))}
    </div>
  );
}

async function ShopResults({ category }: { category?: string }) {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  const products = (data ?? []) as Product[];

  if (error) {
    return (
      <p className="border border-ink-line px-4 py-3 text-sm text-ink-muted">
        We couldn&apos;t load the collection right now. Please try again.
      </p>
    );
  }

  if (products.length === 0) {
    return (
      <div className="border border-dashed border-ink-line px-6 py-20 text-center">
        <p className="eyebrow">An empty rail</p>
        <p className="mt-3 text-sm text-ink-muted">
          {category
            ? `Nothing in “${category}” is ready yet. Try another rail.`
            : "The collection is between fittings. Check back shortly."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} priority={index < 3} />
      ))}
    </div>
  );
}

export default async function ShopPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const supabase = await createClient();
  const { data: categoryRows } = await supabase.from("products").select("category");
  const categories = Array.from(
    new Set((categoryRows ?? []).map((row) => row.category))
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-ink-line pb-4">
        <h1 className="eyebrow">The Collection</h1>
        <CategoryFilter categories={categories} active={category} />
      </div>

      <Suspense fallback={<ProductGridSkeleton />}>
        <ShopResults category={category} />
      </Suspense>
    </div>
  );
}
