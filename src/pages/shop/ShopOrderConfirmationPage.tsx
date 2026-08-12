import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Package, Mail } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatEur, ShopOrder } from "@/lib/shop";

const ShopOrderConfirmationPage = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<ShopOrder | null>(null);

  useEffect(() => {
    if (!orderNumber) return;
    supabase
      .from("shop_orders")
      .select("*, shop_order_items(*)")
      .eq("order_number", orderNumber)
      .maybeSingle()
      .then(({ data }) => setOrder((data as ShopOrder) ?? null));
  }, [orderNumber]);

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Bestellung bestätigt" description="Deine Bestellung im METROPOL TOURS Shop wurde aufgenommen." path="/shop/bestellung" noindex />
      <Header />

      <main className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Vielen Dank für deine Bestellung!</h1>
          <p className="text-muted-foreground mt-3">
            Deine Bestellnummer lautet <span className="font-semibold text-foreground">{orderNumber}</span>.
          </p>
          <p className="text-sm text-muted-foreground mt-2 flex items-center justify-center gap-1.5">
            <Mail className="w-4 h-4" /> Eine Bestätigung wurde dir per E-Mail geschickt.
          </p>
        </div>

        {order && (
          <div className="mt-10 rounded-2xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Package className="w-4 h-4" /> Bestellübersicht</h2>
            <div className="space-y-2">
              {order.shop_order_items?.map((i) => (
                <div key={i.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {i.quantity} × {i.product_name}{i.variant_label ? ` (${i.variant_label})` : ""}
                  </span>
                  <span className="font-medium">{formatEur(i.line_total)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Zwischensumme</span><span>{formatEur(order.subtotal)}</span></div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-primary"><span>Rabatt</span><span>-{formatEur(order.discount_amount)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">Versand</span><span>{formatEur(order.shipping_cost)}</span></div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-border"><span>Gesamt</span><span>{formatEur(order.total)}</span></div>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild><Link to="/shop">Weiter einkaufen</Link></Button>
          <Button asChild variant="outline"><Link to="/shop/bestellungen">Meine Bestellungen</Link></Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ShopOrderConfirmationPage;
