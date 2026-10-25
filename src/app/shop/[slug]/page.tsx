import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddToCart } from "@/components/AddToCart";
import { ProductImage } from "@/components/ProductImage";
import { formatNaira } from "@/lib/format";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function getProduct(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Product | null) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  return { title: product?.name ?? "Product not found" };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  return (
    <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-paper-warm">
        <ProductImage
          src={product.image_url}
          alt={product.name}
          sizes="(max-width: 1024px) 100vw, 55vw"
          priority
        />
      </div>

      <div className="lg:py-6">
        {product.category ? <p className="eyebrow capitalize">{product.category}</p> : null}

        <h1 className="mt-4 text-2xl font-normal sm:text-3xl">{product.name}</h1>
        <p className="mt-3 text-lg text-ink-muted">{formatNaira(product.price)}</p>

        {product.description ? (
          <p className="mt-6 max-w-prose leading-relaxed text-ink-muted">
            {product.description}
          </p>
        ) : null}

        <div className="mt-10">
          <AddToCart product={product} />
        </div>

        <dl className="mt-10 space-y-2 border-t border-ink-line pt-6 text-sm text-ink-muted">
          <div className="flex gap-2">
            <dt className="font-medium text-ink">Made to order</dt>
            <dd>· allow a few days for tailoring</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-ink">Delivery</dt>
            <dd>· arranged after your order, pay on delivery</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
