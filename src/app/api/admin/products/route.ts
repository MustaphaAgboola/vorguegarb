import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthed } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

/** Product photos live in this public Storage bucket (see supabase/schema.sql). */
const BUCKET = "product-images";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional().default(""),
  // Naira, stored as an integer. Comes off a form field, so parse from string.
  price: z.coerce.number().int().min(0).max(100_000_000),
  category: z.string().trim().min(2).max(60).optional().default("general"),
  // Comma-separated in the form; normalised to an array below.
  sizes: z.string().trim().max(200).optional().default(""),
  inStock: z.enum(["true", "false"]).optional().default("true"),
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Rejects anything the caller is not allowed to do, else hands back an admin client. */
async function requireAdmin(req: Request) {
  const { user } = await getAuthed(req);
  if (!user) {
    return { error: NextResponse.json({ error: "Please sign in." }, { status: 401 }) };
  }
  if (!isAdmin(user.email)) {
    return { error: NextResponse.json({ error: "Not allowed." }, { status: 403 }) };
  }
  return { admin: createAdminClient() };
}

/** POST /api/admin/products — create a product, optionally with an uploaded photo. */
export async function POST(req: Request) {
  const gate = await requireAdmin(req);
  if (gate.error) return gate.error;
  const admin = gate.admin!;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected a form submission." }, { status: 400 });
  }

  const parsed = productSchema.safeParse({
    name: form.get("name"),
    description: form.get("description") ?? "",
    price: form.get("price"),
    category: form.get("category") ?? "general",
    sizes: form.get("sizes") ?? "",
    inStock: form.get("inStock") ?? "true",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the product details.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const body = parsed.data;

  // Upload the photo first: a failure here should not leave a product behind.
  let imageUrl: string | null = null;
  const file = form.get("image");
  if (file instanceof File && file.size > 0) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Image must be a JPEG, PNG, WebP or AVIF file." },
        { status: 400 }
      );
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 400 });
    }

    const extension = file.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${slugify(body.name) || "product"}-${Date.now()}.${extension}`;

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("product image upload failed:", uploadError);
      return NextResponse.json({ error: "Could not upload the image." }, { status: 400 });
    }

    imageUrl = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  const sizes = body.sizes
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const { data: product, error } = await admin
    .from("products")
    .insert({
      name: body.name,
      slug: slugify(body.name) || `product-${Date.now()}`,
      description: body.description,
      price: body.price,
      category: body.category.toLowerCase(),
      image_url: imageUrl,
      sizes,
      in_stock: body.inStock === "true",
    })
    .select("id,slug")
    .single();

  if (error) {
    console.error("create product failed:", error);
    // 23505 = unique_violation on products.slug
    const message =
      error.code === "23505"
        ? "A product with that name already exists. Try a different name."
        : "Could not save the product.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ product }, { status: 201 });
}

/** DELETE /api/admin/products — remove a product by id. */
export async function DELETE(req: Request) {
  const gate = await requireAdmin(req);
  if (gate.error) return gate.error;
  const admin = gate.admin!;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = z.object({ id: z.string().uuid() }).safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  }

  const { error } = await admin.from("products").delete().eq("id", parsed.data.id);
  if (error) {
    console.error("delete product failed:", error);
    // order_items references products, so a sold piece cannot be removed.
    const message =
      error.code === "23503"
        ? "This piece appears in an existing order, so it can't be deleted. Mark it sold out instead."
        : "Could not delete the product.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
