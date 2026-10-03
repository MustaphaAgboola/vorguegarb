"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type CartItem = {
  id: string;
  product_id: string;
  size: string;
  quantity: number;
  products: { name: string; slug: string; price: number; image_url: string | null };
};

/** Highest quantity allowed per line. Mirrors the DB check constraint. */
export const MAX_QUANTITY = 20;

type CartCtx = {
  items: CartItem[];
  loading: boolean;
  count: number;
  subtotal: number;
  add: (productId: string, size: string | null, quantity?: number) => Promise<boolean>;
  setQty: (productId: string, size: string, quantity: number) => Promise<boolean>;
  remove: (productId: string, size: string) => Promise<boolean>;
};

const Ctx = createContext<CartCtx | null>(null);
export const useCart = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<CartItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const res = await fetch("/api/cart", { cache: "no-store" });
    setItems(res.ok ? (await res.json()).items : []);
    setLoading(false);
  }, []);

  // Track the logged-in user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setUserId(session?.user?.id ?? null)
    );
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  // Load the cart and subscribe to live changes
  useEffect(() => {
    refetch();
    if (!userId) return;
    const channel = supabase
      .channel(`cart-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cart_items", filter: `user_id=eq.${userId}` },
        () => refetch()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, refetch]);

  const call = async (method: string, body: unknown) => {
    const res = await fetch("/api/cart", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      window.location.href = `/login?next=${encodeURIComponent(location.pathname)}`;
      return false;
    }
    await refetch();
    return res.ok;
  };

  const value: CartCtx = {
    items,
    loading,
    count: items.reduce((n, i) => n + i.quantity, 0),
    subtotal: items.reduce((n, i) => n + i.quantity * i.products.price, 0),
    add: (productId, size, quantity = 1) => call("POST", { productId, size, quantity }),
    setQty: (productId, size, quantity) => call("PATCH", { productId, size, quantity }),
    remove: (productId, size) => call("DELETE", { productId, size }),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}