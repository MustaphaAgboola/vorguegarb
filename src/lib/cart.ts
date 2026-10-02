// Cart state helpers. Pure functions so they can be unit tested and reused
// by the CartProvider (React context) and read from localStorage.

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number; // display only — the server recomputes the real total
  imageUrl: string | null;
  size: string | null;
  quantity: number;
};

export const CART_STORAGE_KEY = "voguegarb.cart";
export const MAX_QUANTITY = 20;

/** Same product in a different size is a different cart line. */
export const cartItemKey = (productId: string, size: string | null) =>
  `${productId}::${size ?? ""}`;

export function addItem(items: CartItem[], next: CartItem): CartItem[] {
  const key = cartItemKey(next.productId, next.size);
  const existing = items.find((i) => cartItemKey(i.productId, i.size) === key);
  if (!existing) return [...items, next];

  return items.map((i) =>
    cartItemKey(i.productId, i.size) === key
      ? { ...i, quantity: Math.min(MAX_QUANTITY, i.quantity + next.quantity) }
      : i
  );
}

export function updateQuantity(items: CartItem[], key: string, quantity: number): CartItem[] {
  if (quantity < 1) return items;
  return items.map((i) =>
    cartItemKey(i.productId, i.size) === key
      ? { ...i, quantity: Math.min(MAX_QUANTITY, quantity) }
      : i
  );
}

export function removeItem(items: CartItem[], key: string): CartItem[] {
  return items.filter((i) => cartItemKey(i.productId, i.size) !== key);
}

export const cartCount = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.quantity, 0);

export const cartSubtotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.price * i.quantity, 0);

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.productId === "string" &&
    typeof v.slug === "string" &&
    typeof v.name === "string" &&
    typeof v.price === "number" &&
    (v.imageUrl === null || typeof v.imageUrl === "string") &&
    (v.size === null || typeof v.size === "string") &&
    typeof v.quantity === "number" &&
    v.quantity >= 1
  );
}

/** Defensive parse so corrupted localStorage never crashes the app. */
export function parseCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartItem);
  } catch {
    return [];
  }
}
