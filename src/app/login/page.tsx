import type { Metadata } from "next";
import Link from "next/link";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";

export const metadata: Metadata = { title: "Sign in" };

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams;

  // Only ever redirect to a relative path (no open redirects).
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/shop";

  return (
    <div className="mx-auto max-w-sm py-10 text-center">
      <h1 className="text-2xl font-semibold">Sign in to VogueGarb</h1>
      <p className="mt-2 text-sm text-stone-600">
        Browsing is open to everyone. Sign in with Google to check out and track
        your orders.
      </p>

      {error ? (
        <p role="alert" className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          We couldn&apos;t sign you in. Please try again.
        </p>
      ) : null}

      <div className="mt-8">
        <GoogleLoginButton next={target} />
      </div>

      <p className="mt-6 text-xs text-stone-500">
        We only use your Google name, email and photo.
      </p>

      <Link
        href="/shop"
        className="mt-8 inline-block text-sm text-stone-600 hover:text-accent hover:underline"
      >
        Continue browsing instead
      </Link>
    </div>
  );
}
