import { supabase } from './supabase';

/** A row from `public.products` (see supabase/schema.sql). */
export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  sizes: string[];
  in_stock: boolean;
};

const PRODUCT_COLUMNS = 'id, name, slug, description, price, category, image_url, sizes, in_stock';

const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Format an integer naira amount the Nigerian way, e.g. 45000 -> "₦45,000". */
export function formatNaira(amount: number): string {
  return naira.format(amount);
}

/** Seed images use root-relative paths (e.g. `/products/x.jpg`); make them absolute. */
export function resolveImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  const base = process.env.EXPO_PUBLIC_API_URL ?? '';
  return `${base}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

/** All in-stock-and-out products for the shop grid, oldest first. */
export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Product[];
}

/** A single product by id, or null when it does not exist. */
export async function fetchProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return (data as Product | null) ?? null;
}
