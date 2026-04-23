export interface Product {
  id: string;
  sku: string;
  name_jp: string;
  name_en: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  origin: string;
  status: "公開" | "下書き" | "入荷待";
  tonal: string;
  specs: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  order_no: string;
  user_id: string;
  user_name: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: string;
  shipping_address: string;
  payment_method: string;
  created_at: string;
}

export interface OrderItem {
  product_id: string;
  name_jp: string;
  name_en: string;
  price: number;
  quantity: number;
  tonal: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: "admin" | "user";
  name_jp: string;
  name_kana: string;
  phone: string;
  birth_date: string;
  postal_code: string;
  address: string;
  created_at: string;
}
