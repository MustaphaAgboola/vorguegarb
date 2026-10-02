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
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-stone-100">
        <ProductImage
          src={product.image_url}
          alt={product.name}
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>

      <div className="lg:py-4">
        {product.category ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            {product.category}
          </p>
        ) : null}

        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{product.name}</h1>
        <p className="mt-3 text-xl font-medium">{formatNaira(product.price)}</p>

        {product.description ? (
          <p className="mt-4 leading-relaxed text-stone-700">{product.description}</p>
        ) : null}

        <div className="mt-8">
          <AddToCart product={product} />
        </div>

        <dl className="mt-10 space-y-2 border-t border-stone-200 pt-6 text-sm text-stone-600">
          <div className="flex gap-2">
            <dt className="font-medium text-stone-800">Made to order</dt>
            <dd>· allow a few days for tailoring</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-stone-800">Delivery</dt>
            <dd>· arranged after your order, pay on delivery</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
