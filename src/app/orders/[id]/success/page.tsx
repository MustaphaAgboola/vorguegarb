import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatNaira, shortOrderId } from "@/lib/format";
import type { Order } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Order confirmed" };

type Props = { params: Promise<{ id: string }> };

export default async function OrderSuccessPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS guarantees the user can only read their own order; an invalid id or
  // someone else's order both resolve to null.
  const { data } = await supabase
    .from("orders")
    .select(
      "id,status,total,created_at,full_name,phone,address,city,state,notes,email_sent_at,order_items(id,name,unit_price,size,quantity)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  const order = data as unknown as Order;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-8 text-center">
        <p className="text-3xl" aria-hidden="true">
          ✓
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Thank you, {order.full_name}!</h1>
        <p className="mt-2 text-sm text-stone-700">
          Your order <strong>#{shortOrderId(order.id)}</strong> is confirmed. A copy has
          been sent to your email.
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="text-base font-semibold">Order summary</h2>
        <ul className="mt-4 divide-y divide-stone-100 border-y border-stone-100">
          {(order.order_items ?? []).map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-3 text-sm">
              <span>
                {item.name}
                {item.size ? ` · ${item.size}` : ""} × {item.quantity}
              </span>
              <span className="whitespace-nowrap">
                {formatNaira(item.unit_price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between text-base font-semibold">
          <span>Total</span>
          <span>{formatNaira(order.total)}</span>
        </div>

        <div className="mt-6 border-t border-stone-200 pt-4 text-sm text-stone-600">
          <p className="font-medium text-stone-800">Delivering to</p>
          <p className="mt-1">
            {order.address}, {order.city}, {order.state}
            <br />
            {order.phone}
          </p>
          {order.notes ? <p className="mt-2 italic">Notes: {order.notes}</p> : null}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/orders" className="btn-outline">
          View my orders
        </Link>
        <Link href="/shop" className="btn-accent">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
