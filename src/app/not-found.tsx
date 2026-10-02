import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-accent">404</p>
      <h1 className="mt-2 text-2xl font-semibold">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-stone-600">
        The piece you&apos;re looking for may have sold out or moved.
      </p>
      <Link href="/shop" className="btn-accent mt-6">
        Back to the shop
      </Link>
    </div>
  );
}
