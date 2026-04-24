"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { Product, CartItem } from "@/lib/types";

interface CartState {
  items: CartItem[];
  totalCount: number;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
}

const CartContext = createContext<CartState>({
  items: [],
  totalCount: 0,
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  subtotal: 0,
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // BUG: #3 — マイナス数量でカートに追加すると、合計数量・金額がマイナスになる
  // addItem で quantity のバリデーションをしていないため、負の値がそのまま加算される
  const totalCount = items.reduce((s, i) => s + i.quantity, 0);

  const addItem = useCallback((product: Product, quantity: number) => {
    // BUG: #3 — quantity が負でもそのまま追加。バリデーションなし
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { product, quantity }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // BUG: #10 — 小計が単価×個数ではなく単価のみ表示
  // subtotalの計算自体は正しいが、カート画面の表示で price のみ使う
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, totalCount, addItem, removeItem, updateQuantity, clearCart, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
