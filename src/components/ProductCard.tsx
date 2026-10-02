import Link from "next/link";
import { formatNaira } from "@/lib/format";
import type { Product } from "@/types";
import { ProductImage } from "./ProductImage";

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-stone-100">
        <ProductImage
          src={product.image_url}
          alt={product.name}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
          className="transition-transform duration-500 group-hover:scale-105"
        />
        {!product.in_stock ? (
          <span className="absolute left-2 top-2 rounded-full bg-stone-900/80 px-2.5 py-1 text-[11px] font-medium text-white">
            Sold out
          </span>
        ) : null}
      </div>
      <div className="mt-3 space-y-0.5">
        <h3 className="text-sm font-medium group-hover:text-accent sm:text-base">
          {product.name}
        </h3>
        <p className="text-sm text-stone-600">{formatNaira(product.price)}</p>
      </div>
    </Link>
  );
}
