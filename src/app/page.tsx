import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/ProductCard";
import { HeroCarousel } from "@/components/HeroCarousel";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  // The hero only shows pieces someone can actually buy; the grid below is
  // allowed to include sold-out ones.
  const [featuredResult, heroResult] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: false }).limit(6),
    supabase
      .from("products")
      .select("*")
      .eq("in_stock", true)
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const { data, error } = featuredResult;
  const featured = (data ?? []) as Product[];
  const heroProducts = (heroResult.data ?? []) as Product[];

  return (
    <div className="space-y-20 sm:space-y-28">
      <HeroCarousel products={heroProducts} />

      <section aria-labelledby="featured-heading">
        <div className="flex items-baseline justify-between gap-4 border-b border-ink-line pb-4">
          <h2 id="featured-heading" className="eyebrow">
            Featured pieces
          </h2>
          <Link href="/shop" className="eyebrow transition-colors hover:text-ink">
            View all
          </Link>
        </div>

        <div className="mt-8">
          {error ? (
            <p className="border border-ink-line px-4 py-3 text-sm text-ink-muted">
              We couldn&apos;t load products right now. Please refresh the page.
            </p>
          ) : featured.length === 0 ? (
            <p className="border border-dashed border-ink-line px-6 py-16 text-center text-sm text-ink-muted">
              No products yet. Add your first piece from the admin page.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3">
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
