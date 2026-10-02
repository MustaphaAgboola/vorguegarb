import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckoutForm } from "@/components/CheckoutForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware also guards this, but never render checkout without a session.
  if (!user) redirect("/login?next=/checkout");

  const meta = user.user_metadata ?? {};
  const name = (meta.full_name || meta.name || "") as string;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Checkout</h1>
        <p className="mt-1 text-sm text-stone-600">
          Tell us where to deliver. You&apos;ll pay on delivery.
        </p>
      </div>
      <CheckoutForm defaultName={name} email={user.email ?? ""} />
    </div>
  );
}
