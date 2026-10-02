"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CART_STORAGE_KEY,
  addItem,
  cartCount,
  cartSubtotal,
  parseCart,
  removeItem,
  updateQuantity,
  type CartItem,
} from "@/lib/cart";

type CartContextValue = {
  items: CartItem[];
  /** True once localStorage has been read, so the badge doesn't flash "0". */
  ready: boolean;
  count: number;
  subtotal: number;
  add: (item: CartItem) => void;
  remove: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  // Read once on mount (localStorage is unavailable during SSR).
  useEffect(() => {
    setItems(parseCart(window.localStorage.getItem(CART_STORAGE_KEY)));
    setReady(true);
  }, []);

  // Persist on every change.
  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const add = useCallback((item: CartItem) => setItems((prev) => addItem(prev, item)), []);
  const remove = useCallback(
    (key: string) => setItems((prev) => removeItem(prev, key)),
    []
  );
  const setQuantity = useCallback(
    (key: string, quantity: number) => setItems((prev) => updateQuantity(prev, key, quantity)),
    []
  );
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      ready,
      count: cartCount(items),
      subtotal: cartSubtotal(items),
      add,
      remove,
      setQuantity,
      clear,
    }),
    [items, ready, add, remove, setQuantity, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>.");
  return ctx;
}
