import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 text-2xl font-normal">This one got away</h1>
      <p className="mt-3 text-sm text-ink-muted">
        The piece you&apos;re after may have sold out, moved, or never existed. The rest
        of the collection is still hanging.
      </p>
      <Link href="/shop" className="btn-accent mt-8">
        Back to the shop
      </Link>
    </div>
  );
}
