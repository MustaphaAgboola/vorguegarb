import type { Metadata } from "next";
import { CartView } from "@/components/CartView";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Your cart</h1>
        <p className="mt-1 text-sm text-stone-600">
          Review your pieces before you check out.
        </p>
      </div>
      <CartView />
    </div>
  );
}
