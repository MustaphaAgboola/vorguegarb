import { supabase } from './supabase';

export type OrderItem = {
  id: string;
  name: string;
  unit_price: number;
  size: string | null;
  quantity: number;
};

export type Order = {
  id: string;
  status: 'pending' | 'confirmed';
  total: number;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  notes: string;
  email_sent_at: string | null;
  created_at: string;
  order_items: OrderItem[];
};

/** Same projection the web app uses for /orders and /orders/[id]/success. */
const ORDER_SELECT =
  'id,status,total,created_at,full_name,phone,address,city,state,notes,email_sent_at,order_items(id,name,unit_price,size,quantity)';

/** Short, human-friendly order reference used on pages and in emails. */
export function shortOrderId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

const dateFormatter = new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' });

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function isConfirmed(order: Order): boolean {
  return order.status === 'confirmed';
}

/**
 * The signed-in user's orders, newest first. RLS scopes rows to the owner,
 * so this never returns another account's orders.
 */
export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Order[];
}

/** A single order by id, or null when it does not exist / is not the caller's. */
export async function fetchOrder(id: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as Order | null) ?? null;
}
