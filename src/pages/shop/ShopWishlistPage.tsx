import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/seo/SEO";
import ProductCard from "@/components/shop/ProductCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { normalizeImages, ShopProduct } from "@/lib/shop";
import { toast } from "sonner";

const ShopWishlistPage = () => {
  const { ids, isSaved, toggle } = useWishlist();
  const { addItem } = useCart();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (ids.length === 0) {
        setProducts([]);
        setIsLoading(false);
        return;
      }
      const { data } = await supabase.from("shop_products").select("*").in("id", ids).eq("is_published", true);
      setProducts((data ?? []).map((p) => ({ ...p, images: normalizeImages(p.images) })) as ShopProduct[]);
      setIsLoading(false);
    };
    load();
  }, [ids]);

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Wunschliste" description="Deine gemerkten Produkte im METROPOL TOURS Shop." path="/shop/wunschliste" noindex />
      <Header />

      <main className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-foreground mb-8">Wunschliste</h1>

        {!isLoading && products.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-border">
            <Heart className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-semibold text-foreground">Noch nichts gemerkt</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Speichere Produkte über das Herz-Symbol.</p>
            <Button asChild><Link to="/shop">Zum Shop</Link></Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isSaved={isSaved(p.id)}
                onToggleWishlist={async (prod) => {
                  await toggle(prod.id);
                  toast.success("Von der Wunschliste entfernt");
                }}
                onQuickAdd={(prod) => {
                  addItem({
                    product_id: prod.id,
                    variant_id: null,
                    name: prod.name,
                    slug: prod.slug,
                    variant_label: null,
                    unit_price: Number(prod.price),
                    image: prod.images?.[0] ?? null,
                    max_stock: prod.track_stock ? prod.stock : null,
                  });
                  toast.success(`${prod.name} wurde in den Warenkorb gelegt`);
                }}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ShopWishlistPage;
