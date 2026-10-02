"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  src: string | null;
  alt: string;
  /** Required by next/image for responsive sizing. */
  sizes: string;
  className?: string;
  priority?: boolean;
};

/**
 * Product photo with a graceful fallback: seed data points at local files that
 * may not exist yet, so a missing image shows a clean placeholder instead of a
 * broken one. Must live inside a positioned, sized parent (uses `fill`).
 */
export function ProductImage({ src, alt, sizes, className = "", priority = false }: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        aria-hidden="true"
        className={`grid h-full w-full place-items-center bg-stone-100 ${className}`}
      >
        <span className="text-[10px] uppercase tracking-[0.25em] text-stone-400">
          VogueGarb
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={`object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
