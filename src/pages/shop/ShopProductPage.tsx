import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Heart, Minus, Plus, ShoppingBag, Star, Truck, ShieldCheck, RotateCcw, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/seo/SEO";
import ShopImage from "@/components/shop/ShopImage";
import ProductCard from "@/components/shop/ProductCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import { formatEur, normalizeImages, ShopProduct, ShopVariant } from "@/lib/shop";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Review {
  id: string;
  author_name: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
}

const ShopProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isSaved, toggle } = useWishlist();
  const { user, profile } = useAuth();

  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [variants, setVariants] = useState<ShopVariant[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<ShopProduct[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      setIsLoading(true);
      const { data } = await supabase.from("shop_products").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
      if (!data) {
        setProduct(null);
        setIsLoading(false);
        return;
      }
      const p = { ...data, images: normalizeImages(data.images) } as ShopProduct;
      setProduct(p);
      setActiveImage(0);
      setQuantity(1);

      const [{ data: vars }, { data: revs }, { data: rel }] = await Promise.all([
        supabase.from("shop_product_variants").select("*").eq("product_id", p.id).eq("is_active", true).order("sort_order"),
        supabase.from("shop_reviews").select("id, author_name, rating, title, comment, created_at").eq("product_id", p.id).eq("is_approved", true).order("created_at", { ascending: false }),
        supabase.from("shop_products").select("*").eq("is_published", true).neq("id", p.id).limit(4),
      ]);
      setVariants((vars ?? []) as ShopVariant[]);
      setReviews((revs ?? []) as Review[]);
      setRelated((rel ?? []).map((r) => ({ ...r, images: normalizeImages(r.images) })) as ShopProduct[]);
      setSelectedVariant(vars && vars.length > 0 ? vars[0].id : null);
      setIsLoading(false);
    };
    load();
  }, [slug]);

  const variant = useMemo(() => variants.find((v) => v.id === selectedVariant) ?? null, [variants, selectedVariant]);
  const price = product ? Number(product.price) + Number(variant?.price_modifier ?? 0) : 0;
  const stock = variant ? variant.stock : product?.track_stock ? product.stock : null;
  const soldOut = stock !== null && stock <= 0;
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const handleAdd = (buyNow = false) => {
    if (!product) return;
    addItem(
      {
        product_id: product.id,
        variant_id: variant?.id ?? null,
        name: product.name,
        slug: product.slug,
        variant_label: variant ? `${variant.option_name}: ${variant.option_value}` : null,
        unit_price: price,
        image: product.images?.[0] ?? null,
        max_stock: stock,
      },
      quantity,
    );
    if (buyNow) navigate("/shop/kasse");
    else toast.success(`${product.name} wurde in den Warenkorb gelegt`);
  };

  const submitReview = async () => {
    if (!product) return;
    if (!user) {
      toast.error("Bitte melde dich an, um eine Bewertung abzugeben.");
      navigate("/auth");
      return;
    }
    if (!reviewForm.comment.trim()) {
      toast.error("Bitte schreibe einen kurzen Text.");
      return;
    }
    setSubmittingReview(true);
    const authorName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Kunde";
    const { error } = await supabase.from("shop_reviews").insert({
      product_id: product.id,
      user_id: user.id,
      author_name: authorName,
      rating: reviewForm.rating,
      title: reviewForm.title.trim().slice(0, 120) || null,
      comment: reviewForm.comment.trim().slice(0, 2000),
      is_approved: false,
    });
    setSubmittingReview(false);
    if (error) {
      toast.error("Bewertung konnte nicht gespeichert werden.");
      return;
    }
    setReviewForm({ rating: 5, title: "", comment: "" });
    toast.success("Danke! Deine Bewertung wird geprüft und dann veröffentlicht.");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 grid md:grid-cols-2 gap-10 animate-pulse">
          <div className="aspect-square rounded-2xl bg-muted" />
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-2/3" />
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-24 bg-muted rounded" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-foreground">Produkt nicht gefunden</h1>
          <Button asChild className="mt-6"><Link to="/shop">Zurück zum Shop</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={product.seo_title || product.name}
        description={product.seo_description || product.short_description || `${product.name} im offiziellen METROPOL TOURS Shop kaufen.`}
        path={`/shop/produkt/${product.slug}`}
        type="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.short_description || product.description || product.name,
          sku: product.sku || product.id,
          brand: { "@type": "Brand", name: "METROPOL TOURS" },
          offers: {
            "@type": "Offer",
            price: price.toFixed(2),
            priceCurrency: "EUR",
            availability: soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
          },
          ...(reviews.length
            ? { aggregateRating: { "@type": "AggregateRating", ratingValue: avgRating.toFixed(1), reviewCount: reviews.length } }
            : {}),
        }}
      />
      <Header />

      <main className="container mx-auto px-4 py-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <Link to="/shop" className="hover:text-foreground">Shop</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground truncate">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="aspect-square rounded-2xl overflow-hidden border border-border bg-muted">
              <ShopImage src={product.images?.[activeImage]} alt={product.name} loading="eager" className="w-full h-full object-cover" />
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    aria-label={`Bild ${i + 1} anzeigen`}
                    className={cn("aspect-square rounded-lg overflow-hidden border-2", i === activeImage ? "border-primary" : "border-border")}
                  >
                    <ShopImage src={img} alt={`${product.name} Bild ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {product.is_new && <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-primary text-primary-foreground">Neu</span>}
              {product.is_bestseller && <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-foreground text-background">Bestseller</span>}
              {product.is_sale && <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-destructive text-destructive-foreground">Angebot</span>}
            </div>

            <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>

            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("w-4 h-4", i < Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">{avgRating.toFixed(1)} · {reviews.length} Bewertungen</span>
              </div>
            )}

            <div className="mt-5 flex items-end gap-3">
              <span className="text-3xl font-bold text-foreground">{formatEur(price)}</span>
              {product.compare_at_price && product.compare_at_price > price && (
                <span className="text-lg text-muted-foreground line-through mb-1">{formatEur(product.compare_at_price)}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">inkl. {product.tax_rate}% MwSt. zzgl. Versand</p>

            {product.short_description && <p className="mt-5 text-muted-foreground">{product.short_description}</p>}

            {variants.length > 0 && (
              <div className="mt-6">
                <Label className="text-sm font-medium">{variants[0].option_name}</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => { setSelectedVariant(v.id); setQuantity(1); }}
                      disabled={v.stock <= 0}
                      className={cn(
                        "px-4 py-2 rounded-xl border text-sm font-medium transition-colors",
                        v.id === selectedVariant ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground",
                        v.stock <= 0 && "opacity-40 line-through cursor-not-allowed",
                      )}
                    >
                      {v.option_value}
                      {Number(v.price_modifier) !== 0 && ` (${Number(v.price_modifier) > 0 ? "+" : ""}${formatEur(v.price_modifier)})`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center border border-border rounded-xl">
                <button className="p-3" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Menge verringern"><Minus className="w-4 h-4" /></button>
                <span className="w-10 text-center font-semibold">{quantity}</span>
                <button className="p-3" onClick={() => setQuantity((q) => Math.min(q + 1, stock ?? 99))} aria-label="Menge erhöhen"><Plus className="w-4 h-4" /></button>
              </div>
              <span className={cn("text-sm font-medium", soldOut ? "text-destructive" : "text-primary")}>
                {soldOut ? "Ausverkauft" : stock !== null ? `${stock} auf Lager` : "Verfügbar"}
              </span>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="flex-1 rounded-xl gap-2" disabled={soldOut} onClick={() => handleAdd(false)}>
                <ShoppingBag className="w-4 h-4" /> In den Warenkorb
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl" disabled={soldOut} onClick={() => handleAdd(true)}>
                Direkt kaufen
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl px-4"
                aria-label="Zur Wunschliste hinzufügen"
                onClick={async () => {
                  const added = await toggle(product.id);
                  toast.success(added ? "Zur Wunschliste hinzugefügt" : "Von der Wunschliste entfernt");
                }}
              >
                <Heart className={cn("w-4 h-4", isSaved(product.id) && "fill-destructive text-destructive")} />
              </Button>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 text-center">
              {[
                { icon: Truck, label: "Versandfrei ab 75 €" },
                { icon: RotateCcw, label: "14 Tage Rückgabe" },
                { icon: ShieldCheck, label: "Sichere Zahlung" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="rounded-xl border border-border p-3">
                  <Icon className="w-4 h-4 mx-auto text-primary mb-1.5" />
                  <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
                </div>
              ))}
            </div>

            {product.description && (
              <div className="mt-8 pt-8 border-t border-border">
                <h2 className="font-semibold text-foreground mb-3">Produktbeschreibung</h2>
                <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-16 pt-10 border-t border-border">
          <h2 className="text-xl font-bold text-foreground mb-6">Bewertungen</h2>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {reviews.length === 0 && <p className="text-muted-foreground">Noch keine Bewertungen – sei der Erste!</p>}
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn("w-3.5 h-3.5", i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-foreground">{r.author_name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("de-DE")}</span>
                  </div>
                  {r.title && <p className="font-semibold text-foreground mt-2">{r.title}</p>}
                  {r.comment && <p className="text-sm text-muted-foreground mt-1">{r.comment}</p>}
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border p-5 h-fit">
              <h3 className="font-semibold text-foreground mb-4">Produkt bewerten</h3>
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button key={i} onClick={() => setReviewForm((f) => ({ ...f, rating: i + 1 }))} aria-label={`${i + 1} Sterne`}>
                    <Star className={cn("w-6 h-6", i < reviewForm.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                  </button>
                ))}
              </div>
              <Input
                placeholder="Titel (optional)"
                value={reviewForm.title}
                onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                className="mb-3"
              />
              <Textarea
                placeholder="Wie gefällt dir das Produkt?"
                value={reviewForm.comment}
                onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                rows={4}
                maxLength={2000}
              />
              <Button className="w-full mt-3" onClick={submitReview} disabled={submittingReview}>
                Bewertung senden
              </Button>
              {!user && <p className="text-xs text-muted-foreground mt-2">Für eine Bewertung ist eine Anmeldung nötig.</p>}
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-bold text-foreground mb-6">Das könnte dir auch gefallen</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ShopProductPage;
