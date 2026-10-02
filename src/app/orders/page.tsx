import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatNaira, shortOrderId } from "@/lib/format";
import type { Order } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My Orders" };

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/orders");

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,status,total,created_at,full_name,phone,address,city,state,notes,email_sent_at,order_items(id,name,unit_price,size,quantity)"
    )
    .order("created_at", { ascending: false });

  const orders = (data ?? []) as unknown as Order[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">My Orders</h1>
        <p className="mt-1 text-sm text-stone-600">
          Every piece you&apos;ve ordered from VogueGarb.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          We couldn&apos;t load your orders right now. Please try again.
        </p>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">No orders yet</h2>
          <p className="mt-1 text-sm text-stone-600">
            When you place your first order it will show up here.
          </p>
          <Link href="/shop" className="btn-accent mt-6">
            Shop the collection
          </Link>
        </div>
      ) : (
        <ul className="space-y-6">
          {orders.map((order) => (
            <li key={order.id} className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="font-semibold">Order #{shortOrderId(order.id)}</p>
                  <p className="text-sm text-stone-500">{formatDate(order.created_at)}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    order.status === "confirmed"
                      ? "bg-green-50 text-green-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {order.status === "confirmed" ? "Confirmed" : "Pending"}
                </span>
              </div>

              <ul className="mt-4 divide-y divide-stone-100 border-y border-stone-100">
                {(order.order_items ?? []).map((item) => (
                  <li key={item.id} className="flex justify-between gap-4 py-2 text-sm">
                    <span>
                      {item.name}
                      {item.size ? ` · ${item.size}` : ""} × {item.quantity}
                    </span>
                    <span className="whitespace-nowrap text-stone-600">
                      {formatNaira(item.unit_price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-stone-600">
                  {order.address}, {order.city}, {order.state}
                </p>
                <p className="font-semibold">{formatNaira(order.total)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
