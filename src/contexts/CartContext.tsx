"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useRef } from "react";
import type { Product, CartItem } from "@/lib/types";

interface CartState {
  items: CartItem[];
  totalCount: number;
  headerBadgeCount: number;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
}

const CartContext = createContext<CartState>({
  items: [],
  totalCount: 0,
  headerBadgeCount: 0,
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  subtotal: 0,
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  // BUG: #3 — 商品を削除後、件数バッジが更新されない
  // headerBadgeCount は追加時のみ更新し、削除時には更新しない
  const headerBadgeRef = useRef(0);
  const [headerBadgeCount, setHeaderBadgeCount] = useState(0);

  const totalCount = items.reduce((s, i) => s + i.quantity, 0);

  const addItem = useCallback((product: Product, quantity: number) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      let newItems: CartItem[];
      if (existing) {
        newItems = prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      } else {
        newItems = [...prev, { product, quantity }];
      }
      // バッジカウントは追加時に更新
      const newTotal = newItems.reduce((s, i) => s + i.quantity, 0);
      headerBadgeRef.current = newTotal;
      setHeaderBadgeCount(newTotal);
      return newItems;
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
    // BUG: #3 — 削除時にheaderBadgeCountを更新しない
    // setHeaderBadgeCount は呼ばない
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
      // BUG: #3 — 数量0以下で削除してもバッジ更新しない
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    headerBadgeRef.current = 0;
    setHeaderBadgeCount(0);
  }, []);

  // BUG: #10 — 小計が単価×個数ではなく単価のみ表示
  // subtotalの計算自体は正しいが、カート画面の表示で price のみ使う
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, totalCount, headerBadgeCount, addItem, removeItem, updateQuantity, clearCart, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
