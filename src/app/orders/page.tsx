import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { formatDate, formatNaira, shortOrderId } from "@/lib/format";
import type { Order } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Orders" };

const ORDER_SELECT =
  "id,user_id,status,total,created_at,full_name,phone,address,city,state,notes,email_sent_at,order_items(id,name,unit_price,size,quantity)";

/**
 * Admins see every customer's orders; everyone else sees their own.
 *
 * RLS scopes `orders` to auth.uid(), so the shop-wide view has to go through
 * the service role. That is gated on isAdmin() here, exactly as the admin API
 * routes are.
 */
async function loadOrders(email: string | undefined) {
  if (isAdmin(email)) {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("orders")
      .select(ORDER_SELECT)
      .order("created_at", { ascending: false });

    // Customer email lives on auth.users, not orders. Best effort: losing it
    // should degrade the view, not break it.
    const emails = new Map<string, string>();
    const { data: userList } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of userList?.users ?? []) {
      if (u.email) emails.set(u.id, u.email);
    }

    return { orders: (data ?? []) as unknown as Order[], error, emails, shopWide: true };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false });

  return {
    orders: (data ?? []) as unknown as Order[],
    error,
    emails: new Map<string, string>(),
    shopWide: false,
  };
}

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/orders");

  const { orders, error, emails, shopWide } = await loadOrders(user.email);

  const revenue = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-ink-line pb-4">
        <div>
          <h1 className="eyebrow">{shopWide ? "Customer orders" : "My orders"}</h1>
          <p className="mt-3 text-sm text-ink-muted">
            {shopWide
              ? "Every order placed on VogueGarb, newest first."
              : "Every piece you've ordered from VogueGarb."}
          </p>
        </div>
        {shopWide && orders.length > 0 ? (
          <p className="eyebrow">
            {orders.length} {orders.length === 1 ? "order" : "orders"} ·{" "}
            {formatNaira(revenue)}
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="border border-red-600 px-4 py-3 text-sm text-red-700">
          We couldn&apos;t load orders right now. Please try again.
        </p>
      ) : orders.length === 0 ? (
        <div className="border border-dashed border-ink-line px-6 py-20 text-center">
          <p className="eyebrow">{shopWide ? "No orders yet" : "No orders yet"}</p>
          <p className="mt-3 text-sm text-ink-muted">
            {shopWide
              ? "Orders placed by customers will appear here."
              : "When you place your first order it will show up here."}
          </p>
          {shopWide ? null : (
            <Link href="/shop" className="btn-accent mt-8">
              Shop the collection
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-5">
          {orders.map((order) => (
            <li key={order.id} className="border border-ink-line p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Order #{shortOrderId(order.id)}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-label text-ink-muted">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {shopWide && !order.email_sent_at ? (
                    <span className="border border-ink-line px-2.5 py-1 text-[10px] font-medium uppercase tracking-label text-ink-muted">
                      No email sent
                    </span>
                  ) : null}
                  <span
                    className={`border px-2.5 py-1 text-[10px] font-medium uppercase tracking-label ${
                      order.status === "confirmed"
                        ? "border-ink bg-ink text-paper"
                        : "border-ink-line text-ink-muted"
                    }`}
                  >
                    {order.status === "confirmed" ? "Confirmed" : "Pending"}
                  </span>
                </div>
              </div>

              {shopWide ? (
                <div className="mt-4 border-t border-ink-line pt-4">
                  <p className="eyebrow mb-2 text-ink">Customer</p>
                  <p className="text-sm">{order.full_name}</p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {order.user_id && emails.get(order.user_id) ? (
                      <>
                        <a
                          href={`mailto:${emails.get(order.user_id)}`}
                          className="underline underline-offset-2"
                        >
                          {emails.get(order.user_id)}
                        </a>
                        {" · "}
                      </>
                    ) : null}
                    <a href={`tel:${order.phone}`} className="underline underline-offset-2">
                      {order.phone}
                    </a>
                  </p>
                </div>
              ) : null}

              <ul className="mt-4 divide-y divide-ink-line border-y border-ink-line">
                {(order.order_items ?? []).map((item) => (
                  <li key={item.id} className="flex justify-between gap-4 py-2.5 text-sm">
                    <span>
                      {item.name}
                      {item.size ? ` · ${item.size}` : ""} × {item.quantity}
                    </span>
                    <span className="whitespace-nowrap text-ink-muted">
                      {formatNaira(item.unit_price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                <div className="text-sm text-ink-muted">
                  <p>
                    {order.address}, {order.city}, {order.state}
                  </p>
                  {shopWide && order.notes ? (
                    <p className="mt-1 italic">Notes: {order.notes}</p>
                  ) : null}
                </div>
                <p className="text-base font-medium">{formatNaira(order.total)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
