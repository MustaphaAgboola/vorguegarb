import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(6);

  const featured = (data ?? []) as Product[];
  const hero = featured[0];

  return (
    <div className="space-y-20 sm:space-y-28">
      <section className="relative isolate">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-paper-warm sm:aspect-[21/9]">
          {hero ? (
            <ProductImage
              src={hero.image_url}
              alt={hero.name}
              sizes="100vw"
              priority
              className="object-cover"
            />
          ) : null}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-ink/25"
          />
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-12">
            <p className="text-[11px] font-medium uppercase tracking-wider text-paper/80">
              Lagos, Nigeria
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-normal leading-[1.1] text-paper sm:text-5xl">
              Bespoke fashion,
              <br />
              made to order.
            </h1>
            <div className="mt-7">
              <Link
                href="/shop"
                className="inline-flex items-center border border-paper bg-paper px-8 py-3.5 text-[11px] font-medium uppercase tracking-label text-ink transition-colors hover:bg-transparent hover:text-paper"
              >
                Shop the collection
              </Link>
            </div>
          </div>
        </div>
      </section>

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
