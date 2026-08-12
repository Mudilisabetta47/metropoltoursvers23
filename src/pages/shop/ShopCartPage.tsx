import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/seo/SEO";
import ShopImage from "@/components/shop/ShopImage";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { formatEur } from "@/lib/shop";

const ShopCartPage = () => {
  const { items, subtotal, updateQuantity, removeItem } = useCart();

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Warenkorb" description="Dein Warenkorb im METROPOL TOURS Shop." path="/shop/warenkorb" noindex />
      <Header />

      <main className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-foreground mb-8">Warenkorb</h1>

        {items.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-border">
            <ShoppingBag className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-semibold text-foreground">Dein Warenkorb ist leer</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Entdecke unsere Produkte im Shop.</p>
            <Button asChild><Link to="/shop">Zum Shop</Link></Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={`${item.product_id}-${item.variant_id ?? "base"}`} className="flex gap-4 rounded-2xl border border-border p-4">
                  <Link to={`/shop/produkt/${item.slug}`} className="w-24 h-24 rounded-xl overflow-hidden bg-muted shrink-0">
                    <ShopImage src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/shop/produkt/${item.slug}`} className="font-semibold text-foreground hover:text-primary line-clamp-2">
                      {item.name}
                    </Link>
                    {item.variant_label && <p className="text-sm text-muted-foreground">{item.variant_label}</p>}
                    <p className="text-sm text-muted-foreground mt-1">{formatEur(item.unit_price)} pro Stück</p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center border border-border rounded-lg">
                        <button className="p-2" aria-label="Menge verringern" onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity - 1)}>
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button className="p-2" aria-label="Menge erhöhen" onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity + 1)}>
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        className="text-sm text-muted-foreground hover:text-destructive flex items-center gap-1"
                        onClick={() => removeItem(item.product_id, item.variant_id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Entfernen
                      </button>
                    </div>
                  </div>
                  <div className="font-bold text-foreground whitespace-nowrap">{formatEur(item.unit_price * item.quantity)}</div>
                </div>
              ))}
            </div>

            <aside className="h-fit rounded-2xl border border-border p-6 sticky top-24">
              <h2 className="font-semibold text-foreground mb-4">Zusammenfassung</h2>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Zwischensumme</span>
                <span className="font-medium text-foreground">{formatEur(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm mb-4">
                <span className="text-muted-foreground">Versand</span>
                <span className="text-muted-foreground">wird im Checkout berechnet</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-border pt-4">
                <span>Gesamt</span>
                <span>{formatEur(subtotal)}</span>
              </div>
              <Button asChild size="lg" className="w-full mt-6 rounded-xl gap-2">
                <Link to="/shop/kasse">Zur Kasse <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button asChild variant="ghost" className="w-full mt-2">
                <Link to="/shop">Weiter einkaufen</Link>
              </Button>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ShopCartPage;
