import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import {
  MapPin, Calendar, ArrowRight, Star, Clock, Search,
  SlidersHorizontal, Heart, Check, Hotel, Coffee, Bus, ChevronRight,
  X, Filter, ArrowUpDown, Shield, Sparkles, Users, Award, HeadphonesIcon,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { usePackageTours } from "@/hooks/useCMS";
import { cn } from "@/lib/utils";

import editorialHero from "@/assets/reisen-editorial-hero.jpg";
import tourCroatia from "@/assets/tour-croatia.jpg";
import tourSlovenia from "@/assets/tour-slovenia.jpg";
import tourBosnia from "@/assets/tour-bosnia.jpg";
import tourMontenegro from "@/assets/tour-montenegro.jpg";
import tourSerbien from "@/assets/tour-serbien.jpg";
import tourNordmazedonien from "@/assets/tour-nordmazedonien.jpg";
import tourAlbanien from "@/assets/tour-albanien.jpg";
import tourKosovo from "@/assets/tour-kosovo.jpg";

const imageMap: Record<string, string> = {
  '/tour-croatia.jpg': tourCroatia,
  '/tour-slovenia.jpg': tourSlovenia,
  '/tour-bosnia.jpg': tourBosnia,
  '/tour-montenegro.jpg': tourMontenegro,
  '/tour-serbien.jpg': tourSerbien,
  '/tour-nordmazedonien.jpg': tourNordmazedonien,
  '/tour-albanien.jpg': tourAlbanien,
  '/tour-kosovo.jpg': tourKosovo,
};

const DURATION_CHIPS = [
  { key: "1-3", label: "1–3 Tage", min: 1, max: 3 },
  { key: "4-5", label: "4–5 Tage", min: 4, max: 5 },
  { key: "6-8", label: "6–8 Tage", min: 6, max: 8 },
  { key: "9+", label: "9+ Tage", min: 9, max: 99 },
];

const SORT_OPTIONS = [
  { value: "popular", label: "Beliebt" },
  { value: "price-asc", label: "Preis (niedrig → hoch)" },
  { value: "price-desc", label: "Preis (hoch → niedrig)" },
  { value: "date", label: "Nächster Termin" },
  { value: "duration", label: "Dauer" },
];

// Curated themes (filter terms matched against country/category/tags)
const THEMES = [
  { key: "kroatien", label: "Adria & Küste", subtitle: "Strand & Meer", image: tourCroatia },
  { key: "slowenien", label: "Alpen & Natur", subtitle: "Aktiv & Outdoor", image: tourSlovenia },
  { key: "bosnien", label: "Kultur & Geschichte", subtitle: "Städte erleben", image: tourBosnia },
  { key: "montenegro", label: "Verborgene Juwelen", subtitle: "Geheimtipps", image: tourMontenegro },
];

const TRUST_ITEMS = [
  { icon: Shield, title: "Sichere Buchung", subtitle: "SSL & DSGVO" },
  { icon: Award, title: "Premium-Komfort", subtitle: "Moderne 4★ Reisebusse" },
  { icon: HeadphonesIcon, title: "Persönlicher Service", subtitle: "Beratung aus Hannover" },
  { icon: Users, title: "Über 12.000 Reisende", subtitle: "4,8 ★ Bewertung" },
];

const FAQ_ITEMS = [
  { q: "Wie funktioniert die Sitzplatzwahl?", a: "Nach Ihrer Buchung können Sie je nach Tarif einen Wunschsitzplatz im Bus auswählen. Im Tarif 'Komfort' und höher ist die Sitzplatzreservierung inklusive." },
  { q: "Wie bekomme ich meine Tickets?", a: "Nach erfolgreicher Zahlung erhalten Sie Ihre Buchungsbestätigung, Rechnung und Ihren Reise-Voucher per E-Mail. Sie können alle Dokumente auch jederzeit in 'Meine Reisen' herunterladen." },
  { q: "Kann ich kostenlos stornieren?", a: "Je nach gewähltem Tarif ist eine kostenfreie Stornierung bis zu 14 Tage vor Abfahrt möglich. Details finden Sie in der Tarifauswahl auf der Detailseite jeder Reise." },
  { q: "Ist eine Reiseversicherung enthalten?", a: "Eine Reiseversicherung ist optional buchbar. Sie können diese bei der Buchung als Zusatzleistung hinzufügen." },
];

const ReisenPage = () => {
  const navigate = useNavigate();
  const { tours, isLoading } = usePackageTours();
  const catalogRef = useRef<HTMLDivElement>(null);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortBy, setSortBy] = useState("popular");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [savedTours, setSavedTours] = useState<Set<string>>(new Set());
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const getImageSrc = (imageUrl: string | null, heroUrl: string | null | undefined, destination: string) => {
    const url = heroUrl || imageUrl;
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) return url;
    if (url && imageMap[url]) return imageMap[url];
    const fallbackKey = `/tour-${destination.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')}.jpg`;
    return imageMap[fallbackKey] || tourCroatia;
  };

  const toggleSaved = (id: string) => {
    setSavedTours(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleDuration = (key: string) => {
    setSelectedDurations(prev =>
      prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key]
    );
  };

  // Dynamic chips (countries + categories + tags)
  const categoryChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [{ key: "all", label: "Alle Reisen" }];
    const seen = new Set<string>();
    tours.forEach(t => {
      const country = t.country?.trim();
      if (country && !seen.has(country.toLowerCase())) {
        seen.add(country.toLowerCase());
        chips.push({ key: country.toLowerCase(), label: country });
      }
    });
    tours.forEach(t => {
      const cat = t.category?.trim();
      if (cat && !seen.has(cat.toLowerCase())) {
        seen.add(cat.toLowerCase());
        chips.push({ key: cat.toLowerCase(), label: cat });
      }
    });
    tours.forEach(t => {
      (t.tags || []).forEach(tag => {
        const normalized = tag.trim();
        if (normalized && !seen.has(normalized.toLowerCase())) {
          seen.add(normalized.toLowerCase());
          chips.push({ key: normalized.toLowerCase(), label: normalized });
        }
      });
    });
    return chips;
  }, [tours]);

  // Autocomplete suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) {
      return tours.slice(0, 6).map(t => ({ id: t.id, slug: t.slug, label: t.destination, sub: `${t.country} · ${t.duration_days} Tage` }));
    }
    const q = searchQuery.toLowerCase();
    return tours
      .filter(t =>
        t.destination.toLowerCase().includes(q) ||
        t.country.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q)
      )
      .slice(0, 8)
      .map(t => ({ id: t.id, slug: t.slug, label: t.destination, sub: `${t.country} · ${t.duration_days} Tage` }));
  }, [tours, searchQuery]);

  const maxPrice = useMemo(() => {
    if (tours.length === 0) return 1000;
    return Math.ceil(Math.max(...tours.map(t => t.price_from)) / 50) * 50;
  }, [tours]);

  useEffect(() => {
    if (maxPrice > 0) setPriceRange([0, maxPrice]);
  }, [maxPrice]);

  const filteredTours = useMemo(() => {
    let result = [...tours];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.destination.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q) ||
        t.country.toLowerCase().includes(q) ||
        (t.short_description || "").toLowerCase().includes(q)
      );
    }
    if (activeCategory !== "all") {
      result = result.filter(t => {
        const tags = (t.tags || []).map(tag => tag.toLowerCase());
        const cat = (t.category || "").toLowerCase();
        const country = (t.country || "").toLowerCase();
        return tags.includes(activeCategory) || cat.includes(activeCategory) || country === activeCategory;
      });
    }
    if (selectedDurations.length > 0) {
      const ranges = selectedDurations.map(k => DURATION_CHIPS.find(c => c.key === k)!);
      result = result.filter(t => ranges.some(r => t.duration_days >= r.min && t.duration_days <= r.max));
    }
    result = result.filter(t => t.price_from >= priceRange[0] && t.price_from <= priceRange[1]);
    if (onlyAvailable) {
      result = result.filter(t => (t.max_participants || 50) - (t.current_participants || 0) > 0);
    }
    switch (sortBy) {
      case "price-asc": result.sort((a, b) => a.price_from - b.price_from); break;
      case "price-desc": result.sort((a, b) => b.price_from - a.price_from); break;
      case "date": result.sort((a, b) => new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime()); break;
      case "duration": result.sort((a, b) => a.duration_days - b.duration_days); break;
      default: result.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)); break;
    }
    return result;
  }, [tours, searchQuery, sortBy, activeCategory, selectedDurations, priceRange, onlyAvailable]);

  const activeFilterCount = [
    activeCategory !== "all",
    selectedDurations.length > 0,
    priceRange[0] > 0 || priceRange[1] < maxPrice,
    onlyAvailable,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setActiveCategory("all");
    setSelectedDurations([]);
    setPriceRange([0, maxPrice]);
    setOnlyAvailable(false);
    setSearchQuery("");
  };

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold text-sm text-foreground mb-3">Preisbereich</h4>
        <Slider min={0} max={maxPrice} step={10} value={priceRange}
          onValueChange={(v) => setPriceRange(v as [number, number])} className="mb-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{priceRange[0]} €</span><span>{priceRange[1]} €</span>
        </div>
      </div>
      <Separator />
      <div>
        <h4 className="font-semibold text-sm text-foreground mb-3">Reisedauer</h4>
        <div className="flex flex-wrap gap-2">
          {DURATION_CHIPS.map(chip => (
            <button key={chip.key} onClick={() => toggleDuration(chip.key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                selectedDurations.includes(chip.key)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50"
              )}>{chip.label}</button>
          ))}
        </div>
      </div>
      <Separator />
      <div className="flex items-center justify-between">
        <Label htmlFor="available" className="text-sm font-medium cursor-pointer">Nur verfügbare Reisen</Label>
        <Checkbox id="available" checked={onlyAvailable} onCheckedChange={(v) => setOnlyAvailable(v as boolean)} />
      </div>
      <Separator />
      <div>
        <h4 className="font-semibold text-sm text-foreground mb-3">Leistungen inklusive</h4>
        <div className="space-y-2.5">
          {[{ icon: Hotel, label: "Hotel inkl." }, { icon: Coffee, label: "Frühstück inkl." }, { icon: Bus, label: "Busfahrt inkl." }, { icon: Shield, label: "Versicherung optional" }].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <item.icon className="w-4 h-4 text-primary" />
              <span>{item.label}</span>
              <Check className="w-3.5 h-3.5 text-primary ml-auto" />
            </div>
          ))}
        </div>
      </div>
      {activeFilterCount > 0 && (
        <>
          <Separator />
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={clearFilters}>
            <X className="w-3.5 h-3.5 mr-1" /> Alle Filter zurücksetzen
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-16 lg:pt-20">
        {/* ============== EDITORIAL HERO ============== */}
        <section className="relative h-[78vh] min-h-[560px] max-h-[820px] overflow-hidden">
          <img src={editorialHero} alt="Premium Reisebus an der Adria-Küste"
            className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/70" />

          <div className="relative h-full max-w-[1240px] mx-auto px-4 sm:px-6 flex flex-col justify-center text-white">
            <span className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full border border-white/30 backdrop-blur-md text-[11px] uppercase tracking-[0.18em] font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Kuratierte Pauschalreisen · Saison 2026
            </span>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[1.05] max-w-4xl mb-6 tracking-tight">
              Reisen, die <em className="not-italic font-serif" style={{ fontStyle: "italic" }}>bleiben.</em>
            </h1>
            <p className="max-w-xl text-base md:text-lg text-white/85 leading-relaxed mb-10 font-light">
              Handverlesene Routen durch Europa – im Premium-Reisebus, mit 4★ Hotels,
              persönlichem Service und allem inklusive. Ab Hannover & 20+ weiteren Städten.
            </p>

            {/* SMART SEARCH BAR */}
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 p-2 sm:p-2.5 max-w-3xl">
              <div className="flex flex-col sm:flex-row gap-2 items-stretch">
                <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                  <PopoverTrigger asChild>
                    <div className="flex-1 relative cursor-text">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Wohin möchten Sie? z. B. Kroatien, Paris, Adria…"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                        onFocus={() => setSearchOpen(true)}
                        className="pl-11 h-12 border-0 bg-transparent text-foreground text-sm focus-visible:ring-0 shadow-none"
                      />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <Command shouldFilter={false}>
                      <CommandList>
                        <CommandEmpty>Keine Reise gefunden.</CommandEmpty>
                        <CommandGroup heading={searchQuery ? "Treffer" : "Beliebte Ziele"}>
                          {searchSuggestions.map(s => (
                            <CommandItem key={s.id} value={s.label}
                              onSelect={() => { setSearchOpen(false); navigate(`/reisen/${s.slug || s.id}`); }}
                              className="cursor-pointer">
                              <MapPin className="w-3.5 h-3.5 mr-2 text-primary" />
                              <div className="flex-1">
                                <div className="text-sm font-medium">{s.label}</div>
                                <div className="text-xs text-muted-foreground">{s.sub}</div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button onClick={scrollToCatalog} className="h-12 px-7 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shrink-0">
                  <Search className="w-4 h-4 mr-2" /> Reisen finden
                </Button>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/80">
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary" /> Sofortbestätigung</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary" /> Sichere Zahlung</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary" /> Bestpreis-Garantie</span>
            </div>
          </div>
        </section>

        {/* ============== TRUST STRIP ============== */}
        <section className="bg-card border-b border-border">
          <div className="max-w-[1240px] mx-auto px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {TRUST_ITEMS.map((it, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <it.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-tight">{it.title}</p>
                    <p className="text-xs text-muted-foreground leading-tight">{it.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============== THEME EXPLORER ============== */}
        <section className="bg-muted/30 py-14 lg:py-20">
          <div className="max-w-[1240px] mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Inspiration nach Thema</span>
                <h2 className="font-serif text-3xl md:text-5xl mt-2 text-foreground leading-tight">Wählen Sie Ihre Welt</h2>
                <p className="text-muted-foreground mt-3 max-w-lg">Vier Stile, eine Leidenschaft: das Außergewöhnliche. Finden Sie die Reise, die zu Ihnen passt.</p>
              </div>
              <button onClick={() => { setActiveCategory("all"); scrollToCatalog(); }}
                className="text-sm font-semibold border-b border-foreground pb-1 hover:text-primary hover:border-primary transition-all self-start md:self-end">
                Alle Kollektionen ansehen →
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {THEMES.map((theme) => (
                <button key={theme.key}
                  onClick={() => { setActiveCategory(theme.key); scrollToCatalog(); }}
                  className="group relative aspect-[4/5] overflow-hidden rounded-3xl text-left">
                  <img src={theme.image} alt={theme.label}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary mb-1">{theme.subtitle}</p>
                    <h3 className="font-serif text-xl md:text-2xl leading-tight">{theme.label}</h3>
                    <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Entdecken <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Breadcrumb */}
        <div className="bg-background border-b border-border" ref={catalogRef}>
          <div className="max-w-[1240px] mx-auto px-4 py-3">
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <button onClick={() => navigate("/")} className="hover:text-primary transition-colors">Startseite</button>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-foreground font-medium">Pauschalreisen</span>
            </nav>
          </div>
        </div>

        {/* Category Chips Bar */}
        <div className="bg-background border-b border-border sticky top-[64px] lg:top-[72px] z-30 backdrop-blur-md">
          <div className="max-w-[1240px] mx-auto px-4 py-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {categoryChips.map(chip => (
                <button key={chip.key} onClick={() => setActiveCategory(chip.key)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium border whitespace-nowrap transition-all shrink-0",
                    activeCategory === chip.key
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
                  )}>
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ============== CATALOG ============== */}
        <div className="max-w-[1240px] mx-auto px-4 py-8 lg:py-12">
          <div className="flex gap-6 lg:gap-10">
            {/* Filters */}
            <aside className="hidden lg:block w-[280px] shrink-0">
              <div className="sticky top-[150px]">
                <div className="bg-card rounded-2xl border border-border p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4" /> Filter
                    </h3>
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="text-xs">{activeFilterCount}</Badge>
                    )}
                  </div>
                  <FilterContent />
                </div>
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              {/* Result header */}
              <div className="flex items-end justify-between mb-6 gap-3 flex-wrap">
                <div>
                  <h2 className="font-serif text-2xl md:text-3xl text-foreground leading-tight">
                    {activeCategory === "all" ? "Alle Reisen" : categoryChips.find(c => c.key === activeCategory)?.label}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-semibold text-foreground">{filteredTours.length}</span> Reisen verfügbar
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="lg:hidden">
                        <Filter className="w-4 h-4 mr-1.5" /> Filter
                        {activeFilterCount > 0 && <Badge className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center text-[10px]">{activeFilterCount}</Badge>}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[320px] overflow-y-auto">
                      <SheetHeader><SheetTitle className="flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> Filter</SheetTitle></SheetHeader>
                      <div className="mt-6"><FilterContent /></div>
                    </SheetContent>
                  </Sheet>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-auto min-w-[180px] h-9 text-sm">
                      <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Cards Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border">
                      <Skeleton className="w-full h-[260px] rounded-none" />
                      <div className="p-5 space-y-3">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-10 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredTours.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-2xl border border-border">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-foreground mb-2">Keine Reisen gefunden</h3>
                  <p className="text-muted-foreground mb-4 text-sm">Versuchen Sie andere Suchbegriffe oder setzen Sie die Filter zurück.</p>
                  <Button variant="outline" size="sm" onClick={clearFilters}>Filter zurücksetzen</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                  {filteredTours.map((tour) => {
                    const availableSeats = (tour.max_participants || 50) - (tour.current_participants || 0);
                    const isSaved = savedTours.has(tour.id);
                    const heroSrc = getImageSrc(tour.image_url, tour.hero_image_url, tour.destination);

                    return (
                      <article key={tour.id}
                        className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-foreground/20 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.25)] transition-all duration-500 flex flex-col">
                        {/* Image */}
                        <div className="relative aspect-[16/11] overflow-hidden cursor-pointer"
                          onClick={() => navigate(`/reisen/${tour.slug || tour.id}`)}>
                          <img src={heroSrc} alt={tour.destination}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                          {/* Badges */}
                          <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                            {tour.is_featured && (
                              <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                                ★ Bestseller
                              </span>
                            )}
                            {tour.discount_percent > 0 && (
                              <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                                −{tour.discount_percent}%
                              </span>
                            )}
                          </div>

                          {/* Wishlist */}
                          <button onClick={(e) => { e.stopPropagation(); toggleSaved(tour.id); }}
                            aria-label="Merken"
                            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all shadow-md active:scale-95">
                            <Heart className={cn("w-4 h-4 transition-colors", isSaved ? "fill-destructive text-destructive" : "text-foreground")} />
                          </button>

                          {/* Bottom info on image */}
                          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
                            <div className="flex items-center gap-1.5 text-xs font-medium">
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="drop-shadow">{tour.country}</span>
                            </div>
                            {availableSeats <= 6 && availableSeats > 0 && (
                              <span className="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                                Nur noch {availableSeats}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                            <span>{tour.location}</span>
                            <span className="w-1 h-1 bg-border rounded-full" />
                            <span>{tour.duration_days} Tage</span>
                            <span className="w-1 h-1 bg-border rounded-full" />
                            <span className="flex items-center gap-0.5 text-amber-500">
                              <Star className="w-3 h-3 fill-current" /> 4.8
                            </span>
                          </div>

                          <h3 className="font-serif text-xl md:text-2xl text-foreground leading-snug mb-3 cursor-pointer group-hover:text-primary transition-colors line-clamp-2"
                            onClick={() => navigate(`/reisen/${tour.slug || tour.id}`)}>
                            {tour.destination}
                          </h3>

                          {tour.short_description && (
                            <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                              {tour.short_description}
                            </p>
                          )}

                          {/* Inclusion icons */}
                          <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground mb-4">
                            <span className="flex items-center gap-1"><Hotel className="w-3.5 h-3.5 text-primary" /> Hotel</span>
                            <span className="flex items-center gap-1"><Coffee className="w-3.5 h-3.5 text-primary" /> Frühstück</span>
                            <span className="flex items-center gap-1"><Bus className="w-3.5 h-3.5 text-primary" /> Reisebus</span>
                          </div>

                          {/* Footer: price + cta */}
                          <div className="mt-auto pt-4 border-t border-border flex items-end justify-between gap-3">
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                                {tour.departure_date ? `Ab ${format(parseISO(tour.departure_date), "dd. MMM", { locale: de })}` : "Auf Anfrage"}
                              </p>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-xs text-muted-foreground">ab</span>
                                <span className="font-serif text-3xl font-bold text-foreground">{tour.price_from}€</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground">pro Person · alles inkl.</p>
                            </div>
                            <Button size="sm" className="rounded-xl"
                              onClick={() => navigate(`/reisen/${tour.slug || tour.id}`)}>
                              Details
                              <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============== METROPOL VERSPRECHEN ============== */}
        <section className="bg-foreground text-background py-20">
          <div className="max-w-[1240px] mx-auto px-4 grid md:grid-cols-4 gap-10">
            <div className="md:col-span-1">
              <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-4">
                Das Metropol<br /><em className="text-primary not-italic" style={{ fontStyle: "italic" }}>Versprechen.</em>
              </h2>
              <div className="w-16 h-px bg-primary" />
            </div>
            <div className="md:col-span-3 grid sm:grid-cols-3 gap-8">
              {[
                { icon: Sparkles, title: "Premium als Standard", text: "4★ Hotels, moderne Reisebusse mit WLAN, Klima und WC. Komfort, der keine Kompromisse macht." },
                { icon: Users, title: "Persönlich begleitet", text: "Erfahrene Reiseleitung von Hannover bis zum Ziel – mit Insider-Wissen und Herzblut." },
                { icon: Shield, title: "Sicher buchen", text: "SSL-Verschlüsselung, geprüfte Zahlungsanbieter, EU-Pauschalreiserecht. Sie sind abgesichert." },
              ].map((p, i) => (
                <div key={i}>
                  <div className="text-primary mb-3"><p.icon className="w-8 h-8" /></div>
                  <h4 className="text-lg font-semibold mb-2 text-background">{p.title}</h4>
                  <p className="text-sm text-background/70 leading-relaxed">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-card border-t border-border">
          <div className="max-w-[1240px] mx-auto px-4 py-16">
            <div className="grid md:grid-cols-3 gap-10">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Häufige Fragen</span>
                <h2 className="font-serif text-3xl md:text-4xl mt-2 text-foreground leading-tight">Alles, was Sie wissen müssen.</h2>
                <p className="text-muted-foreground mt-4 text-sm">Noch eine Frage? Unser Team in Hannover ist persönlich für Sie da.</p>
              </div>
              <div className="md:col-span-2">
                <Accordion type="single" collapsible>
                  {FAQ_ITEMS.map((item, i) => (
                    <AccordionItem key={i} value={`faq-${i}`}>
                      <AccordionTrigger className="text-left text-foreground font-semibold">{item.q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">{item.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </div>
        </section>

        {/* Group CTA */}
        <section className="bg-muted/40 border-t border-border">
          <div className="max-w-[1240px] mx-auto px-4 py-16 text-center">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-3">Sie planen eine Gruppenreise?</h2>
            <p className="text-muted-foreground mb-7 max-w-xl mx-auto">
              Ab 20 Personen erstellen wir Ihnen ein individuelles Angebot mit exklusiven Konditionen.
            </p>
            <Button size="lg" onClick={() => navigate("/business")} className="gap-2 rounded-xl">
              Gruppenanfrage stellen <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ReisenPage;
