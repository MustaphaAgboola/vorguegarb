import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthed } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { ORDER_STATUSES } from "@/types";

const statusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(ORDER_STATUSES),
});

/**
 * PATCH /api/admin/orders — move an order to a new status.
 *
 * Customers have no update grant on `orders.status`, so the write goes through
 * the service role behind the same ADMIN_EMAILS check as the products route.
 * Only `status` changes: totals, items and delivery details stay as placed.
 */
export async function PATCH(req: Request) {
  const { user } = await getAuthed(req);
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (!isAdmin(user.email)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = statusSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order or status." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
    .select("id,status")
    .maybeSingle();

  if (error) {
    console.error("update order status failed:", error);
    return NextResponse.json({ error: "Could not update the order." }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: "That order no longer exists." }, { status: 404 });
  }

  return NextResponse.json({ order: data });
}
