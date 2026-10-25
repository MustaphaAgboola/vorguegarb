import Link from "next/link";

export function CategoryFilter({
  categories,
  active,
}: {
  categories: string[];
  active?: string;
}) {
  if (categories.length === 0) return null;

  const base =
    "border-b pb-1 text-[11px] font-medium uppercase tracking-label capitalize transition-colors";
  const on = "border-ink text-ink";
  const off = "border-transparent text-ink-muted hover:text-ink";

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Filter by category">
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
