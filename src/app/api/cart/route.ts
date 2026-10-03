import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthed } from "@/lib/supabase/server";

/** Highest quantity allowed per line. Mirrors the DB check constraint. */
const MAX_QUANTITY = 20;

/** Embed the product so the client can render name/price/photo without extra calls. */
const CART_SELECT =
  "id, product_id, size, quantity, products(name, slug, price, image_url)";

const itemSchema = z.object({
  productId: z.string().uuid(),
  // Empty string and null both mean "no size chosen"; normalised below.
  size: z.string().max(20).nullable().optional(),
  quantity: z.number().int().min(1).max(MAX_QUANTITY).optional().default(1),
});

async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

/** GET /api/cart — the signed-in user's cart lines. */
export async function GET(req: Request) {
  const { supabase, user } = await getAuthed(req);
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const { data, error } = await supabase
    .from("cart_items")
    .select(CART_SELECT)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("load cart failed:", error);
    return NextResponse.json({ error: "Could not load your cart." }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] });
}

/** POST /api/cart — add a line, or bump the quantity of one already in the cart. */
export async function POST(req: Request) {
  const { supabase, user } = await getAuthed(req);
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const parsed = itemSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid cart item." }, { status: 400 });
  }
  const { productId, quantity } = parsed.data;
  const size = parsed.data.size ?? "";

  const { data: existing, error: readError } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .eq("size", size)
    .maybeSingle();

  if (readError) {
    console.error("read cart item failed:", readError);
    return NextResponse.json({ error: "Could not update your cart." }, { status: 500 });
  }

  const nextQuantity = Math.min(MAX_QUANTITY, (existing?.quantity ?? 0) + quantity);

  const { error: writeError } = existing
    ? await supabase.from("cart_items").update({ quantity: nextQuantity }).eq("id", existing.id)
    : await supabase
        .from("cart_items")
        .insert({ user_id: user.id, product_id: productId, size, quantity: nextQuantity });

  if (writeError) {
    console.error("write cart item failed:", writeError);
    return NextResponse.json({ error: "Could not add to cart." }, { status: 400 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}

/** PATCH /api/cart — set the quantity for a single line. */
export async function PATCH(req: Request) {
  const { supabase, user } = await getAuthed(req);
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const parsed = itemSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid cart item." }, { status: 400 });
  }
  const { productId, quantity } = parsed.data;
  const size = parsed.data.size ?? "";

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .eq("size", size);

  if (error) {
    console.error("update cart quantity failed:", error);
    return NextResponse.json({ error: "Could not update your cart." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

/** DELETE /api/cart — remove a single line. */
export async function DELETE(req: Request) {
  const { supabase, user } = await getAuthed(req);
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const parsed = itemSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid cart item." }, { status: 400 });
  }
  const { productId } = parsed.data;
  const size = parsed.data.size ?? "";

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .eq("size", size);

  if (error) {
    console.error("remove cart item failed:", error);
    return NextResponse.json({ error: "Could not update your cart." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}