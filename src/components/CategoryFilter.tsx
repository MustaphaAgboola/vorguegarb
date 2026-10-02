import Link from "next/link";

export function CategoryFilter({
  categories,
  active,
}: {
  categories: string[];
  active?: string;
}) {
  if (categories.length === 0) return null;

  const base = "rounded-full border px-3.5 py-1.5 text-sm capitalize transition-colors";
  const on = "border-accent bg-accent text-white";
  const off = "border-stone-300 bg-white text-stone-700 hover:border-stone-400";

  return (
    <div className="flex flex-wrap gap-2" aria-label="Filter by category">
      <Link href="/shop" className={`${base} ${!active ? on : off}`}>
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c}
          href={`/shop?category=${encodeURIComponent(c)}`}
          className={`${base} ${active === c ? on : off}`}
        >
          {c}
        </Link>
      ))}
    </div>
  );
}
