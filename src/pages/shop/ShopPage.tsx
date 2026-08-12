import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, ShoppingBag, Heart, Package } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/seo/SEO";
import ProductCard from "@/components/shop/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { formatEur, normalizeImages, ShopCategory, ShopProduct } from "@/lib/shop";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SortKey = "recommended" | "price_asc" | "price_desc" | "newest";

const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [sort, setSort] = useState<SortKey>("recommended");
  const [maxPrice, setMaxPrice] = useState<number>(500);
  const [priceFilter, setPriceFilter] = useState<number>(500);
  const [onlySale, setOnlySale] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const activeCategory = searchParams.get("kategorie") ?? "";
  const { addItem, itemCount } = useCart();
  const { isSaved, toggle } = useWishlist();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const [{ data: prod }, { data: cats }] = await Promise.all([
        supabase.from("shop_products").select("*").eq("is_published", true).order("sort_order").order("created_at", { ascending: false }),
        supabase.from("shop_categories").select("*").eq("is_active", true).order("sort_order"),
      ]);
      const mapped = (prod ?? []).map((p) => ({ ...p, images: normalizeImages(p.images) })) as ShopProduct[];
      setProducts(mapped);
      setCategories((cats ?? []) as ShopCategory[]);
      const highest = Math.ceil(Math.max(50, ...mapped.map((p) => Number(p.price))));
      setMaxPrice(highest);
      setPriceFilter(highest);
      setIsLoading(false);
    };
    load();
  }, []);

  const topCategories = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);
  const subCategories = useMemo(
    () => categories.filter((c) => c.parent_id && (!activeCategory || categories.find((p) => p.slug === activeCategory)?.id === c.parent_id)),
    [categories, activeCategory],
  );

  const filtered = useMemo(() => {
    const catIds = new Set<string>();
    if (activeCategory) {
      const cat = categories.find((c) => c.slug === activeCategory);
      if (cat) {
        catIds.add(cat.id);
        categories.filter((c) => c.parent_id === cat.id).forEach((c) => catIds.add(c.id));
      }
    }
    const q = query.trim().toLowerCase();
    let list = products.filter((p) => {
      if (catIds.size > 0 && !(p.category_id && catIds.has(p.category_id))) return false;
      if (q && !(`${p.name} ${p.short_description ?? ""} ${p.description ?? ""}`.toLowerCase().includes(q))) return false;
      if (Number(p.price) > priceFilter) return false;
      if (onlySale && !(p.is_sale || (p.compare_at_price && p.compare_at_price > p.price))) return false;
      if (onlyAvailable && p.track_stock && p.stock <= 0) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "price_asc") return Number(a.price) - Number(b.price);
      if (sort === "price_desc") return Number(b.price) - Number(a.price);
      if (sort === "newest") return (b.created_at ?? "").localeCompare(a.created_at ?? "");
      return Number(b.is_bestseller) - Number(a.is_bestseller) || a.sort_order - b.sort_order;
    });
    return list;
  }, [products, categories, activeCategory, query, priceFilter, onlySale, onlyAvailable, sort]);

  const setCategory = (slug: string) => {
    const next = new URLSearchParams(searchParams);
    if (slug) next.set("kategorie", slug);
    else next.delete("kategorie");
    setSearchParams(next, { replace: true });
  };

  const quickAdd = (p: ShopProduct) => {
    addItem({
      product_id: p.id,
      variant_id: null,
      name: p.name,
      slug: p.slug,
      variant_label: null,
      unit_price: Number(p.price),
      image: p.images?.[0] ?? null,
      max_stock: p.track_stock ? p.stock : null,
    });
    toast.success(`${p.name} wurde in den Warenkorb gelegt`);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Shop – Merchandise & Reisezubehör"
        description="Offizieller METROPOL TOURS Shop: Bekleidung, Reisezubehör und Accessoires für deine nächste Busreise. Versandkostenfrei ab 75 €."
        path="/shop"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "METROPOL TOURS Shop",
          description: "Merchandise und Reisezubehör von METROPOL TOURS",
        }}
      />
      <Header />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background border-b border-border">
          <div className="container mx-auto px-4 py-14 md:py-20">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary mb-3">METROPOL TOURS Shop</p>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground max-w-2xl leading-tight">
              Alles für unterwegs – direkt von deinem Busunternehmen
            </h1>
            <p className="mt-4 text-muted-foreground max-w-xl">
              Hochwertiges Merchandise und praktisches Reisezubehör. Versand innerhalb Deutschlands, kostenfrei ab 75 €.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Produkt suchen…"
                  aria-label="Produkte durchsuchen"
                  className="pl-10 h-12 rounded-xl"
                />
              </div>
              <Button asChild size="lg" variant="outline" className="rounded-xl gap-2">
                <Link to="/shop/warenkorb">
                  <ShoppingBag className="w-4 h-4" /> Warenkorb ({itemCount})
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Category pills */}
        <section className="border-b border-border sticky top-16 z-30 bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setCategory("")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                !activeCategory ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              Alle Produkte
            </button>
            {topCategories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.slug)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  activeCategory === c.slug ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {c.name}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="gap-1.5">
                <Link to="/shop/wunschliste"><Heart className="w-4 h-4" /> <span className="hidden sm:inline">Wunschliste</span></Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="gap-1.5">
                <Link to="/shop/bestellungen"><Package className="w-4 h-4" /> <span className="hidden sm:inline">Bestellungen</span></Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-8">
          {subCategories.length > 0 && activeCategory && (
            <div className="flex flex-wrap gap-2 mb-6">
              {subCategories.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setCategory(s.slug)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:text-foreground"
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filter sidebar */}
            <aside className={cn("lg:w-64 shrink-0 space-y-6", showFilters ? "block" : "hidden lg:block")}>
              <div className="rounded-2xl border border-border p-5 space-y-5">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" /> Filter
                </h2>
                <div>
                  <Label className="text-sm text-muted-foreground">Preis bis {formatEur(priceFilter)}</Label>
                  <Slider
                    value={[priceFilter]}
                    onValueChange={(v) => setPriceFilter(v[0])}
                    min={0}
                    max={maxPrice}
                    step={1}
                    className="mt-3"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox id="only-sale" checked={onlySale} onCheckedChange={(v) => setOnlySale(!!v)} />
                    <Label htmlFor="only-sale" className="text-sm font-normal cursor-pointer">Nur Angebote</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="only-available" checked={onlyAvailable} onCheckedChange={(v) => setOnlyAvailable(!!v)} />
                    <Label htmlFor="only-available" className="text-sm font-normal cursor-pointer">Nur verfügbare Artikel</Label>
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex-1">
              <div className="flex items-center justify-between gap-3 mb-6">
                <p className="text-sm text-muted-foreground">
                  {isLoading ? "Produkte werden geladen…" : `${filtered.length} Artikel`}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="lg:hidden gap-1.5" onClick={() => setShowFilters((s) => !s)}>
                    <SlidersHorizontal className="w-4 h-4" /> Filter
                  </Button>
                  <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                    <SelectTrigger className="w-[190px] h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recommended">Empfohlen</SelectItem>
                      <SelectItem value="newest">Neuheiten</SelectItem>
                      <SelectItem value="price_asc">Preis aufsteigend</SelectItem>
                      <SelectItem value="price_desc">Preis absteigend</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-border overflow-hidden animate-pulse">
                      <div className="aspect-square bg-muted" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20 rounded-2xl border border-dashed border-border">
                  <Package className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                  <h2 className="font-semibold text-foreground">Keine Produkte gefunden</h2>
                  <p className="text-sm text-muted-foreground mt-1">Passe Suche oder Filter an.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtered.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      isSaved={isSaved(p.id)}
                      onToggleWishlist={async (prod) => {
                        const added = await toggle(prod.id);
                        toast.success(added ? "Zur Wunschliste hinzugefügt" : "Von der Wunschliste entfernt");
                      }}
                      onQuickAdd={quickAdd}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ShopPage;
