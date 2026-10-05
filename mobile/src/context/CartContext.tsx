import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { useSession } from '@/hooks/use-session';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export type CartItem = {
  id: string;
  product_id: string;
  size: string;
  quantity: number;
  products: { name: string; slug: string; price: number; image_url: string | null } | null;
};

/** Highest quantity allowed per line. Mirrors the DB check constraint. */
export const MAX_QUANTITY = 20;

type CartContextValue = {
  items: CartItem[];
  loading: boolean;
  count: number;
  subtotal: number;
  add: (productId: string, size: string | null, quantity?: number) => Promise<boolean>;
  setQty: (productId: string, size: string, quantity: number) => Promise<boolean>;
  remove: (productId: string, size: string) => Promise<boolean>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  const userId = session?.user.id ?? null;

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Keep Realtime authenticated so RLS delivers this user's cart events.
  useEffect(() => {
    supabase.realtime.setAuth(session?.access_token ?? null);
  }, [session]);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api('/api/cart');
      if (response.status === 401) {
        setItems([]);
        return;
      }
      if (!response.ok) throw new Error(`Request failed (${response.status}).`);
      const body = (await response.json()) as { items?: CartItem[] };
      setItems(body.items ?? []);
    } catch (error) {
      console.error('load cart failed:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load once the user is known, then refetch on every cart_items change.
  useEffect(() => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }

    refetch();

    const channel = supabase
      .channel(`cart-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cart_items', filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log('CART EVENT', payload.eventType);
          refetch();
        }
      )
      .subscribe((status) => {
        console.log('CART CHANNEL', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refetch]);

  // Refetch when the app comes back to the foreground.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && userId) refetch();
    });
    return () => subscription.remove();
  }, [userId, refetch]);

  const mutate = useCallback(
    async (method: string, body: Record<string, unknown>) => {
      if (!userId) return false;
      try {
        const response = await api('/api/cart', { method, body: JSON.stringify(body) });
        if (!response.ok) return false;
        await refetch();
        return true;
      } catch (error) {
        console.error('cart request failed:', error);
        return false;
      }
    },
    [userId, refetch]
  );

  const add = useCallback(
    (productId: string, size: string | null, quantity = 1) =>
      mutate('POST', { productId, size: size ?? '', quantity }),
    [mutate]
  );

  const setQty = useCallback(
    (productId: string, size: string, quantity: number) =>
      mutate('PATCH', { productId, size, quantity }),
    [mutate]
  );

  const remove = useCallback(
    (productId: string, size: string) => mutate('DELETE', { productId, size }),
    [mutate]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      loading,
      count: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce(
        (total, item) => total + item.quantity * (item.products?.price ?? 0),
        0
      ),
      add,
      setQty,
      remove,
    }),
    [items, loading, add, setQty, remove]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
