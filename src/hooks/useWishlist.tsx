import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const LOCAL_KEY = "metours_shop_wishlist_v1";

function readLocal(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Wishlist: persisted in the database for logged-in customers, in localStorage for guests. */
export function useWishlist() {
  const { user } = useAuth();
  const [ids, setIds] = useState<string[]>(() => readLocal());
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setIds(readLocal());
      return;
    }
    setIsLoading(true);
    const { data } = await supabase.from("shop_wishlist").select("product_id").eq("user_id", user.id);
    setIds((data ?? []).map((r) => r.product_id));
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Merge guest wishlist into the account on login
  useEffect(() => {
    const merge = async () => {
      if (!user) return;
      const local = readLocal();
      if (local.length === 0) return;
      await supabase
        .from("shop_wishlist")
        .upsert(local.map((product_id) => ({ user_id: user.id, product_id })), { onConflict: "user_id,product_id" });
      localStorage.removeItem(LOCAL_KEY);
      load();
    };
    merge();
  }, [user, load]);

  const isSaved = useCallback((productId: string) => ids.includes(productId), [ids]);

  const toggle = useCallback(
    async (productId: string) => {
      const saved = ids.includes(productId);
      const next = saved ? ids.filter((i) => i !== productId) : [...ids, productId];
      setIds(next);
      if (user) {
        if (saved) {
          await supabase.from("shop_wishlist").delete().eq("user_id", user.id).eq("product_id", productId);
        } else {
          await supabase.from("shop_wishlist").insert({ user_id: user.id, product_id: productId });
        }
      } else {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      }
      return !saved;
    },
    [ids, user],
  );

  return { ids, isSaved, toggle, isLoading, reload: load };
}
