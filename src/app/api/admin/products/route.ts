import { NextResponse } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
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

/** Reads the shared product fields off a form submission. */
function parseProductForm(form: FormData) {
  return productSchema.safeParse({
    name: form.get("name"),
    description: form.get("description") ?? "",
    price: form.get("price"),
    category: form.get("category") ?? "general",
    sizes: form.get("sizes") ?? "",
    inStock: form.get("inStock") ?? "true",
  });
}

function parseSizes(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

type UploadResult = { url: string } | { error: NextResponse } | null;

/**
 * Uploads the form's `image` to Storage when one was chosen.
 * Returns null when no file was supplied, so callers can leave the photo as is.
 */
async function uploadImage(
  admin: SupabaseClient,
  form: FormData,
  name: string
): Promise<UploadResult> {
  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0) return null;

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      error: NextResponse.json(
        { error: "Image must be a JPEG, PNG, WebP or AVIF file." },
        { status: 400 }
      ),
    };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return {
      error: NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 400 }),
    };
  }

  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${slugify(name) || "product"}-${Date.now()}.${extension}`;

  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });

  if (error) {
    console.error("product image upload failed:", error);
    return { error: NextResponse.json({ error: "Could not upload the image." }, { status: 400 }) };
  }

  return { url: admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
}

/**
 * Storage path behind one of our own public URLs, or null for anything else.
 * Matches the full project prefix rather than searching for the bucket name, so
 * a value pointing anywhere else — a seed row's local path, another bucket, or
 * a planted URL — can never become a delete target.
 */
function storagePathFrom(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const prefix = `${base}/storage/v1/object/public/${BUCKET}/`;
  if (!imageUrl.startsWith(prefix)) return null;

  const path = imageUrl.slice(prefix.length);
  if (!path || path.startsWith("/") || path.includes("..")) return null;
  return path;
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

  const parsed = parseProductForm(form);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the product details.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const body = parsed.data;

  // Upload the photo first: a failure here should not leave a product behind.
  const upload = await uploadImage(admin, form, body.name);
  if (upload && "error" in upload) return upload.error;

  const { data: product, error } = await admin
    .from("products")
    .insert({
      name: body.name,
      slug: slugify(body.name) || `product-${Date.now()}`,
      description: body.description,
      price: body.price,
      category: body.category.toLowerCase(),
      image_url: upload?.url ?? null,
      sizes: parseSizes(body.sizes),
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

/**
 * PATCH /api/admin/products — update a product. The photo is replaced only when
 * a new file is chosen; the slug is deliberately left alone so existing
 * /shop/[slug] links and any shared URLs keep working.
 */
export async function PATCH(req: Request) {
  const gate = await requireAdmin(req);
  if (gate.error) return gate.error;
  const admin = gate.admin!;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected a form submission." }, { status: 400 });
  }

  const id = z.string().uuid().safeParse(form.get("id"));
  if (!id.success) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  }

  const parsed = parseProductForm(form);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the product details.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const body = parsed.data;

  const { data: existing, error: readError } = await admin
    .from("products")
    .select("id,image_url")
    .eq("id", id.data)
    .maybeSingle();

  if (readError || !existing) {
    return NextResponse.json({ error: "That product no longer exists." }, { status: 404 });
  }

  const upload = await uploadImage(admin, form, body.name);
  if (upload && "error" in upload) return upload.error;

  const { error } = await admin
    .from("products")
    .update({
      name: body.name,
      description: body.description,
      price: body.price,
      category: body.category.toLowerCase(),
      sizes: parseSizes(body.sizes),
      in_stock: body.inStock === "true",
      // Leave the existing photo untouched when no new file was chosen.
      ...(upload ? { image_url: upload.url } : {}),
    })
    .eq("id", id.data);

  if (error) {
    console.error("update product failed:", error);
    return NextResponse.json({ error: "Could not save your changes." }, { status: 400 });
  }

  // The row now points at the new photo, so the old file is safe to drop.
  // Best effort: an orphaned image must never fail the edit.
  if (upload) {
    const stale = storagePathFrom(existing.image_url);
    if (stale) {
      const { error: removeError } = await admin.storage.from(BUCKET).remove([stale]);
      if (removeError) console.error("could not remove replaced image:", removeError);
    }
  }

  return NextResponse.json({ ok: true });
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

  const { data: existing } = await admin
    .from("products")
    .select("image_url")
    .eq("id", parsed.data.id)
    .maybeSingle();

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

  // Row is gone; drop its photo too rather than orphaning it in the bucket.
  const path = storagePathFrom(existing?.image_url ?? null);
  if (path) {
    const { error: removeError } = await admin.storage.from(BUCKET).remove([path]);
    if (removeError) console.error("could not remove deleted product image:", removeError);
  }

  return NextResponse.json({ ok: true });
}
