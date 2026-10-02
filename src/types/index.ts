export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number; // integer naira
  category: string;
  image_url: string | null;
  sizes: string[];
  in_stock: boolean;
  created_at: string;
};

export type OrderItem = {
  id: string;
  name: string;
  unit_price: number;
  size: string | null;
  quantity: number;
};

export type Order = {
  id: string;
  status: "pending" | "confirmed";
  total: number;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  notes: string;
  email_sent_at: string | null;
  created_at: string;
  order_items?: OrderItem[];
};
