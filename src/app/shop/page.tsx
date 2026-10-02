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
      className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4"
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="aspect-[3/4] w-full animate-pulse rounded-xl bg-stone-200" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-stone-200" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-stone-200" />
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
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        We couldn&apos;t load the collection right now. Please try again.
      </p>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 px-6 py-16 text-center">
        <h2 className="text-lg font-semibold">Nothing here yet</h2>
        <p className="mt-1 text-sm text-stone-600">
          {category
            ? `No pieces in \u201c${category}\u201d right now.`
            : "The collection is being restocked. Check back soon."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} priority={index < 4} />
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Shop</h1>
        <p className="mt-1 text-sm text-stone-600">
          Tailored pieces, made to order in Lagos.
        </p>
      </div>

      <CategoryFilter categories={categories} active={category} />

      <Suspense fallback={<ProductGridSkeleton />}>
        <ShopResults category={category} />
      </Suspense>
    </div>
  );
}
