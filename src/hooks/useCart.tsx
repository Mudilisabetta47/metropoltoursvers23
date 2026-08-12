import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export interface CartItem {
  product_id: string;
  variant_id: string | null;
  name: string;
  slug: string;
  variant_label: string | null;
  unit_price: number;
  quantity: number;
  image: string | null;
  max_stock: number | null;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = "metours_shop_cart_v1";

const sameLine = (a: CartItem, productId: string, variantId: string | null) =>
  a.product_id === productId && (a.variant_id ?? null) === (variantId ?? null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full or blocked – cart stays in memory */
    }
  }, [items]);

  const addItem: CartContextType["addItem"] = (item, quantity = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => sameLine(i, item.product_id, item.variant_id));
      if (idx >= 0) {
        const next = [...prev];
        const max = next[idx].max_stock ?? 99;
        next[idx] = { ...next[idx], quantity: Math.min(next[idx].quantity + quantity, Math.max(1, max), 99) };
        return next;
      }
      return [...prev, { ...item, quantity: Math.min(quantity, item.max_stock ?? 99, 99) }];
    });
  };

  const updateQuantity: CartContextType["updateQuantity"] = (productId, variantId, quantity) => {
    setItems((prev) =>
      prev
        .map((i) =>
          sameLine(i, productId, variantId)
            ? { ...i, quantity: Math.max(0, Math.min(quantity, i.max_stock ?? 99, 99)) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  };

  const removeItem: CartContextType["removeItem"] = (productId, variantId) =>
    setItems((prev) => prev.filter((i) => !sameLine(i, productId, variantId)));

  const clearCart = () => setItems([]);

  const value = useMemo<CartContextType>(
    () => ({
      items,
      itemCount: items.reduce((s, i) => s + i.quantity, 0),
      subtotal: Math.round(items.reduce((s, i) => s + i.unit_price * i.quantity, 0) * 100) / 100,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
