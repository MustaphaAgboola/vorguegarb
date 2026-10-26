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
    <Link
      href={`/shop/${product.slug}`}
      className="group block transition-transform duration-500 ease-spring motion-safe:hover:-translate-y-1.5"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-paper-warm">
        <ProductImage
          src={product.image_url}
          alt={product.name}
          sizes="(max-width: 640px) 50vw, 33vw"
          priority={priority}
          className="transition-transform duration-700 ease-spring group-hover:scale-[1.04]"
        />
        {!product.in_stock ? (
          <span className="absolute left-0 top-0 bg-ink px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-label text-paper">
            Sold out
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-normal">
          {product.name}
          {/* Underline grows out from the left on hover. */}
          <span className="block h-px w-0 bg-ink transition-all duration-500 ease-spring group-hover:w-full" />
        </h3>
        <p className="whitespace-nowrap text-sm text-ink-muted">
          {formatNaira(product.price)}
        </p>
      </div>
    </Link>
  );
}
