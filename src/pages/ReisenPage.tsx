import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import {
  MapPin, Calendar, ArrowRight, Star, Clock, Search,
  SlidersHorizontal, Heart, Check, Hotel, Coffee, Bus, ChevronRight,
  X, Filter, ArrowUpDown, Shield,
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { usePackageTours } from "@/hooks/useCMS";
import { cn } from "@/lib/utils";

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

// Dynamic chips built below from tour data

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

const FAQ_ITEMS = [
  { q: "Wie funktioniert die Sitzplatzwahl?", a: "Nach Ihrer Buchung können Sie je nach Tarif einen Wunschsitzplatz im Bus auswählen. Im Tarif 'Komfort' und höher ist die Sitzplatzreservierung inklusive." },
  { q: "Wie bekomme ich meine Tickets?", a: "Nach erfolgreicher Zahlung erhalten Sie Ihre Buchungsbestätigung, Rechnung und Ihren Reise-Voucher per E-Mail. Sie können alle Dokumente auch jederzeit in 'Meine Reisen' herunterladen." },
  { q: "Kann ich kostenlos stornieren?", a: "Je nach gewähltem Tarif ist eine kostenfreie Stornierung bis zu 14 Tage vor Abfahrt möglich. Details finden Sie in der Tarifauswahl auf der Detailseite jeder Reise." },
  { q: "Ist eine Reiseversicherung enthalten?", a: "Eine Reiseversicherung ist optional buchbar. Sie können diese bei der Buchung als Zusatzleistung hinzufügen." },
];

const ReisenPage = () => {
  const navigate = useNavigate();
  const { tours, isLoading } = usePackageTours();
  const searchBarRef = useRef<HTMLDivElement>(null);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [savedTours, setSavedTours] = useState<Set<string>>(new Set());
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sticky search bar
  const [isSticky, setIsSticky] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-80px 0px 0px 0px" }
    );
    if (searchBarRef.current) observer.observe(searchBarRef.current);
    return () => observer.disconnect();
  }, []);

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
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const toggleDuration = (key: string) => {
    setSelectedDurations(prev =>
      prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key]
    );
  };

  // Dynamic category chips from tour data
  const categoryChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [{ key: "all", label: "Alle Reisen" }];
    const seen = new Set<string>();

    // Add unique countries
    tours.forEach(t => {
      const country = t.country?.trim();
      if (country && !seen.has(country.toLowerCase())) {
        seen.add(country.toLowerCase());
        chips.push({ key: country.toLowerCase(), label: country });
      }
    });

    // Add unique categories
    tours.forEach(t => {
      const cat = t.category?.trim();
      if (cat && !seen.has(cat.toLowerCase())) {
        seen.add(cat.toLowerCase());
        chips.push({ key: cat.toLowerCase(), label: cat });
      }
    });

    // Add unique tags
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

  // Max price for slider
  const maxPrice = useMemo(() => {
    if (tours.length === 0) return 1000;
    return Math.ceil(Math.max(...tours.map(t => t.price_from)) / 50) * 50;
  }, [tours]);

  useEffect(() => {
    if (maxPrice > 0) setPriceRange([0, maxPrice]);
  }, [maxPrice]);

  // Filtered and sorted tours
  const filteredTours = useMemo(() => {
    let result = [...tours];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.destination.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q) ||
        t.country.toLowerCase().includes(q) ||
        (t.short_description || "").toLowerCase().includes(q)
      );
    }

    // Category / Country / Tag chip filter
    if (activeCategory !== "all") {
      result = result.filter(t => {
        const tags = (t.tags || []).map(tag => tag.toLowerCase());
        const cat = (t.category || "").toLowerCase();
        const country = (t.country || "").toLowerCase();
        return tags.includes(activeCategory) || cat.includes(activeCategory) || country === activeCategory;
      });
    }

    // Duration
    if (selectedDurations.length > 0) {
      const ranges = selectedDurations.map(k => DURATION_CHIPS.find(c => c.key === k)!);
      result = result.filter(t =>
        ranges.some(r => t.duration_days >= r.min && t.duration_days <= r.max)
      );
    }

    // Price
    result = result.filter(t => t.price_from >= priceRange[0] && t.price_from <= priceRange[1]);

    // Availability
    if (onlyAvailable) {
      result = result.filter(t =>
        (t.max_participants || 50) - (t.current_participants || 0) > 0
      );
    }

    // Sort
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

  // Filter sidebar content (shared between desktop and mobile)
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <h4 className="font-semibold text-sm text-foreground mb-3">Preisbereich</h4>
        <Slider
          min={0}
          max={maxPrice}
          step={10}
          value={priceRange}
          onValueChange={(v) => setPriceRange(v as [number, number])}
          className="mb-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{priceRange[0]}€</span>
          <span>{priceRange[1]}€</span>
        </div>
      </div>

      <Separator />

      {/* Duration */}
      <div>
        <h4 className="font-semibold text-sm text-foreground mb-3">Reisedauer</h4>
        <div className="flex flex-wrap gap-2">
          {DURATION_CHIPS.map(chip => (
            <button
              key={chip.key}
              onClick={() => toggleDuration(chip.key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                selectedDurations.includes(chip.key)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Availability */}
      <div className="flex items-center justify-between">
        <Label htmlFor="available" className="text-sm font-medium cursor-pointer">
          Nur verfügbare Reisen
        </Label>
        <Checkbox
          id="available"
          checked={onlyAvailable}
          onCheckedChange={(v) => setOnlyAvailable(v as boolean)}
        />
      </div>

      <Separator />

      {/* Included Services */}
      <div>
        <h4 className="font-semibold text-sm text-foreground mb-3">Leistungen</h4>
        <div className="space-y-2.5">
          {[
            { icon: Hotel, label: "Hotel inkl." },
            { icon: Coffee, label: "Frühstück inkl." },
            { icon: Bus, label: "Busfahrt inkl." },
            { icon: Shield, label: "Versicherung optional" },
          ].map((item, i) => (
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
            <X className="w-3.5 h-3.5 mr-1" />
            Alle Filter zurücksetzen
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />

      <main className="flex-1 pt-16 lg:pt-20">
        {/* Breadcrumb */}
        <div className="bg-card border-b border-border">
          <div className="max-w-[1240px] mx-auto px-4 py-3">
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <button onClick={() => navigate("/")} className="hover:text-primary transition-colors">Startseite</button>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-foreground font-medium">Pauschalreisen</span>
            </nav>
          </div>
        </div>

        {/* Search Bar Sentinel */}
        <div ref={searchBarRef} />

        {/* Sticky Search Bar */}
        <div className={cn(
          "bg-card border-b border-border transition-shadow z-40",
          isSticky ? "fixed top-[64px] lg:top-[72px] left-0 right-0 shadow-md" : ""
        )}>
          <div className="max-w-[1240px] mx-auto px-4 py-3">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Ziel, Land oder Reise suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 bg-muted/50 border-border"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
              <Button className="h-11 px-6 shrink-0">
                <Search className="w-4 h-4 mr-2" />
                Suchen
              </Button>
              <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
                <span className="font-semibold text-foreground">{filteredTours.length}</span>
                <span>Reisen gefunden</span>
              </div>
            </div>

            {/* Category Chips */}
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
              {categoryChips.map(chip => (
                <button
                  key={chip.key}
                  onClick={() => setActiveCategory(chip.key)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap transition-all",
                    activeCategory === chip.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Spacer when sticky */}
        {isSticky && <div className="h-[140px] sm:h-[120px]" />}

        {/* Main Content: 2-Column Layout */}
        <div className="max-w-[1240px] mx-auto px-4 py-6 lg:py-8">
          <div className="flex gap-6 lg:gap-8">
            {/* Left: Desktop Filter Sidebar */}
            <aside className="hidden lg:block w-[280px] shrink-0">
              <div className="sticky top-[220px]">
                <div className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4" />
                      Filter
                    </h3>
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="text-xs">{activeFilterCount}</Badge>
                    )}
                  </div>
                  <FilterContent />
                </div>
              </div>
            </aside>

            {/* Right: Results */}
            <div className="flex-1 min-w-0">
              {/* Top Bar: Sort + Mobile Filter */}
              <div className="flex items-center justify-between mb-5 gap-3">
                <div className="flex items-center gap-3">
                  {/* Mobile Filter Button */}
                  <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="lg:hidden">
                        <Filter className="w-4 h-4 mr-1.5" />
                        Filter
                        {activeFilterCount > 0 && (
                          <Badge className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center text-[10px]">{activeFilterCount}</Badge>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[320px] overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                          <SlidersHorizontal className="w-4 h-4" />
                          Filter
                        </SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <FilterContent />
                      </div>
                    </SheetContent>
                  </Sheet>

                  <p className="text-sm text-muted-foreground sm:hidden">
                    <span className="font-semibold text-foreground">{filteredTours.length}</span> Reisen
                  </p>
                </div>

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

              {/* Results */}
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-card rounded-xl border border-border overflow-hidden flex flex-col sm:flex-row">
                      <Skeleton className="w-full sm:w-[260px] h-[200px] rounded-none" />
                      <div className="flex-1 p-5 space-y-3">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-10 w-40" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredTours.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-xl border border-border">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-foreground mb-2">Keine Reisen gefunden</h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Versuchen Sie andere Suchbegriffe oder setzen Sie die Filter zurück.
                  </p>
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Filter zurücksetzen
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTours.map((tour) => {
                    const availableSeats = (tour.max_participants || 50) - (tour.current_participants || 0);
                    const isSaved = savedTours.has(tour.id);

                    return (
                      <div
                        key={tour.id}
                        className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-elevated hover:border-primary/20 transition-all duration-300 flex flex-col sm:flex-row"
                      >
                        {/* Image */}
                        <div className="relative w-full sm:w-[280px] h-[200px] sm:min-h-[200px] sm:max-h-[220px] shrink-0 overflow-hidden cursor-pointer"
                          onClick={() => navigate(`/reisen/${tour.slug || tour.id}`)}
                        >
                          <img
                            src={getImageSrc(tour.image_url, tour.hero_image_url, tour.destination)}
                            alt={tour.destination}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                          {/* Badges */}
                          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                            {tour.is_featured && (
                              <Badge className="bg-accent text-accent-foreground text-xs">
                                <Star className="w-3 h-3 mr-1" /> Bestseller
                              </Badge>
                            )}
                            {tour.discount_percent > 0 && (
                              <Badge variant="destructive" className="text-xs">-{tour.discount_percent}%</Badge>
                            )}
                          </div>

                          {/* Save */}
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleSaved(tour.id); }}
                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                          >
                            <Heart className={cn("w-4 h-4", isSaved ? "fill-destructive text-destructive" : "text-muted-foreground")} />
                          </button>

                          {/* Seats Badge */}
                          {availableSeats <= 6 && availableSeats > 0 && (
                            <Badge className="absolute bottom-3 left-3 bg-amber-500 text-white text-xs">
                              Nur noch {availableSeats} Plätze
                            </Badge>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
                          <div>
                            {/* Title + Location */}
                            <h3
                              className="text-lg font-bold text-foreground mb-1 cursor-pointer hover:text-primary transition-colors line-clamp-1"
                              onClick={() => navigate(`/reisen/${tour.slug || tour.id}`)}
                            >
                              {tour.destination} – {tour.duration_days} Tage
                              {tour.included_services?.includes("Hotel") ? " (Bus + Hotel)" : ""}
                            </h3>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{tour.location}, {tour.country}</span>
                            </div>

                            {/* Highlights */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground mb-3">
                              {[
                                { icon: Hotel, text: "Hotel inkl." },
                                { icon: Coffee, text: "Frühstück inkl." },
                                { icon: Bus, text: "Busfahrt inkl." },
                              ].map((h, i) => (
                                <span key={i} className="flex items-center gap-1">
                                  <h.icon className="w-3.5 h-3.5 text-primary" />
                                  {h.text}
                                </span>
                              ))}
                            </div>

                            {/* Travel Info */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                Abfahrt: {tour.departure_date ? format(parseISO(tour.departure_date), "EE, dd. MMM", { locale: de }) : "Auf Anfrage"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {tour.duration_days} Tage
                              </span>
                            </div>

                            {/* Trust badges */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="text-[11px] text-primary flex items-center gap-1">
                                <Check className="w-3 h-3" /> Sofortbestätigung
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Price Box */}
                        <div className="sm:w-[180px] shrink-0 border-t sm:border-t-0 sm:border-l border-border p-4 sm:p-5 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 bg-muted/20">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">ab</p>
                            <p className="text-2xl sm:text-3xl font-bold text-primary">{tour.price_from}€</p>
                            <p className="text-xs text-muted-foreground">pro Person · inkl. Bus + Hotel</p>
                          </div>
                          <div className="flex flex-col gap-2 w-full sm:mt-3">
                            <Button
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => navigate(`/reisen/${tour.slug || tour.id}`)}
                            >
                              Verfügbarkeit prüfen
                              <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="bg-card border-t border-border">
          <div className="max-w-[1240px] mx-auto px-4 py-12 lg:py-16">
            <h2 className="text-2xl font-bold text-foreground mb-6">Häufige Fragen</h2>
            <Accordion type="single" collapsible className="max-w-3xl">
              {FAQ_ITEMS.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-foreground">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-muted/50 border-t border-border">
          <div className="max-w-[1240px] mx-auto px-4 py-12 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">Sie planen eine Gruppenreise?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto text-sm">
              Ab 20 Personen bieten wir individuelle Angebote mit exklusiven Konditionen.
            </p>
            <Button variant="outline" onClick={() => navigate("/business")} className="gap-2">
              Gruppenanfrage stellen
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ReisenPage;
