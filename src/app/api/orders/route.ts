import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthed } from "@/lib/supabase/server";
import { sendOrderConfirmation, type OrderEmailData } from "@/lib/mailgun";

const bodySchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20),
  address: z.string().trim().min(5).max(250),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  notes: z.string().trim().max(500).optional().default(""),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        size: z.string().max(20).nullable().optional(),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1)
    .max(50),
});

export async function POST(req: Request) {
  const { supabase, user } = await getAuthed(req);
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order details.", issues: parsed.error.flatten() }, { status: 400 });
  }
  const b = parsed.data;

  const { data: orderId, error: rpcError } = await supabase.rpc("create_order", {
    p_full_name: b.fullName,
    p_phone: b.phone,
    p_address: b.address,
    p_city: b.city,
    p_state: b.state,
    p_notes: b.notes,
    p_items: b.items.map((i) => ({ product_id: i.productId, size: i.size ?? null, quantity: i.quantity })),
  });
  if (rpcError || !orderId) {
    console.error("create_order failed:", rpcError);
    return NextResponse.json({ error: "Could not place order. Check your cart and try again." }, { status: 400 });
  }

  // Empty the cart on every device
  await supabase.from("cart_items").delete().eq("user_id", user.id);

  // Email is best effort and never fails the order
  try {
    const { data: order } = await supabase
      .from("orders")
      .select("id,total,full_name,phone,address,city,state,order_items(name,unit_price,size,quantity)")
      .eq("id", orderId)
      .single();

    if (order && user.email) {
      await sendOrderConfirmation({ to: user.email, order: order as unknown as OrderEmailData });
      await supabase.from("orders").update({ email_sent_at: new Date().toISOString() }).eq("id", orderId);
    }
  } catch (err) {
    console.error("Confirmation email failed:", err);
  }

  return NextResponse.json({ orderId }, { status: 201 });
}