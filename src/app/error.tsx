"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-stone-600">
        {error.message || "We hit an unexpected error. Please try again."}
      </p>
      <button type="button" onClick={reset} className="btn-accent mt-6">
        Try again
      </button>
    </div>
  );
}
