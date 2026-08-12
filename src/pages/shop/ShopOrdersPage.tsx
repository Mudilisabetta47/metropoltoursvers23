import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Truck } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatEur, ORDER_STATUS, PAYMENT_STATUS, ShopOrder } from "@/lib/shop";
import { cn } from "@/lib/utils";

const ShopOrdersPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      const { data } = await supabase
        .from("shop_orders")
        .select("*, shop_order_items(*)")
        .order("created_at", { ascending: false });
      setOrders((data ?? []) as ShopOrder[]);
      setIsLoading(false);
    };
    if (!authLoading) load();
  }, [user, authLoading]);

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Meine Bestellungen" description="Übersicht deiner Shop-Bestellungen bei METROPOL TOURS." path="/shop/bestellungen" noindex />
      <Header />

      <main className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-foreground mb-8">Meine Bestellungen</h1>

        {!user && !authLoading ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-border">
            <Package className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-semibold text-foreground">Bitte anmelden</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Melde dich an, um deine Bestellungen zu sehen.</p>
            <Button asChild><Link to="/auth">Anmelden</Link></Button>
          </div>
        ) : isLoading ? (
          <p className="text-muted-foreground">Bestellungen werden geladen…</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-border">
            <Package className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-semibold text-foreground">Noch keine Bestellungen</h2>
            <Button asChild className="mt-6"><Link to="/shop">Zum Shop</Link></Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => {
              const status = ORDER_STATUS[o.status] ?? ORDER_STATUS.new;
              const pay = PAYMENT_STATUS[o.payment_status] ?? PAYMENT_STATUS.pending;
              return (
                <div key={o.id} className="rounded-2xl border border-border p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{o.order_number}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("de-DE")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", status.className)}>{status.label}</span>
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", pay.className)}>{pay.label}</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    {o.shop_order_items?.map((i) => (
                      <div key={i.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{i.quantity} × {i.product_name}{i.variant_label ? ` (${i.variant_label})` : ""}</span>
                        <span>{formatEur(i.line_total)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-2">
                    {o.tracking_number ? (
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5" /> Sendungsnummer: {o.tracking_number}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{o.shipping_method_name ?? "Versand"}</span>
                    )}
                    <span className="font-bold text-foreground">{formatEur(o.total)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ShopOrdersPage;
