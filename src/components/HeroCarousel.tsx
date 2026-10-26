"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/types";
import { ProductImage } from "./ProductImage";

const INTERVAL_MS = 5000;

/**
 * Home page hero: the newest pieces, crossfading on a timer.
 *
 * Every slide is rendered and only its opacity changes, so the browser has the
 * next image decoded before it is shown and the swap never flashes.
 */
export function HeroCarousel({ products }: { products: Product[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    // Auto-advancing carousels are hostile to anyone who asked for less motion.
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion.current = query.matches;
    const onChange = (e: MediaQueryListEvent) => {
      reducedMotion.current = e.matches;
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (products.length < 2 || paused || reducedMotion.current) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % products.length),
      INTERVAL_MS
    );
    return () => window.clearInterval(id);
  }, [products.length, paused]);

  if (products.length === 0) return null;

  const current = products[index];

  return (
    <section
      className="relative isolate"
      aria-roledescription="carousel"
      aria-label="Newest pieces"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-paper-warm sm:aspect-[21/9]">
        {products.map((product, i) => (
          <div
            key={product.id}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <ProductImage
              src={product.image_url}
              alt={product.name}
              sizes="100vw"
              priority={i === 0}
            />
          </div>
        ))}

        <div aria-hidden="true" className="absolute inset-0 bg-ink/30" />

        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-12">
          <p className="text-[11px] font-medium uppercase tracking-wider text-paper/80">
            Lagos, Nigeria
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-normal leading-[1.1] text-paper sm:text-5xl">
            Bespoke fashion,
            <br />
            made to order.
          </h1>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              href="/shop"
              className="inline-flex items-center border border-paper bg-paper px-8 py-3.5 text-[11px] font-medium uppercase tracking-label text-ink transition-colors hover:bg-transparent hover:text-paper"
            >
              Shop the collection
            </Link>

            {/* Announces each change to screen readers without stealing focus. */}
            <p aria-live="polite" className="text-[11px] uppercase tracking-label text-paper/85">
              <Link href={`/shop/${current.slug}`} className="underline underline-offset-4">
                {current.name}
              </Link>
            </p>
          </div>

          {products.length > 1 ? (
            <div className="mt-8 flex gap-2.5">
              {products.map((product, i) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Show ${product.name}`}
                  aria-current={i === index}
                  className={`h-0.5 w-10 transition-colors ${
                    i === index ? "bg-paper" : "bg-paper/40 hover:bg-paper/70"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
