"use client";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-6 py-16 text-center">
      <h1 className="text-xl font-semibold">The collection didn&apos;t load</h1>
      <p className="mt-2 text-sm text-stone-600">
        {error.message || "Something went wrong while fetching products."}
      </p>
      <button type="button" onClick={reset} className="btn-accent mt-6">
        Try again
      </button>
    </div>
  );
}
