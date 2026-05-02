import { useState, useEffect } from "react";
import { MapPin, Share2, Heart, ChevronRight, Clock, Bus, Hotel, Coffee, Images, X, ChevronLeft as ChevronLeftIcon, Sun, ShieldCheck, Lock, BadgeCheck, Wallet, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ExtendedPackageTour } from "@/hooks/useTourBuilder";

interface TourHeroSectionProps {
  tour: ExtendedPackageTour;
  heroImage: string;
  lowestPrice?: number;
  onShowMap?: () => void;
}

const TourHeroSection = ({ tour, heroImage, lowestPrice: _lowestPrice, onShowMap }: TourHeroSectionProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  // Build query from most-specific → broader (Adresse hat Vorrang vor reiner Region)
  const queryString = [tour.location, tour.destination, tour.country]
    .filter(Boolean)
    .join(", ");
  const mapQuery = encodeURIComponent(queryString);
  const osmFullUrl = `https://www.openstreetmap.org/search?query=${mapQuery}`;

  // Geocoded coords (lat/lon) – wenn vorhanden zoomen wir präzise
  const [coords, setCoords] = useState<{ lat: number; lon: number; bbox?: [number, number, number, number] } | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    if (!mapOpen || coords || !queryString) return;
    let cancelled = false;
    setGeocoding(true);
    // Versuche zuerst die spezifischste Adresse, dann sukzessive breiter
    const candidates = [
      [tour.location, tour.country].filter(Boolean).join(", "),
      [tour.destination, tour.location, tour.country].filter(Boolean).join(", "),
      [tour.destination, tour.country].filter(Boolean).join(", "),
      [tour.location, tour.country].filter(Boolean).join(", "),
      tour.destination,
    ].filter((q) => q && q.trim().length > 0);

    (async () => {
      for (const q of candidates) {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=0&q=${encodeURIComponent(q)}`;
          const res = await fetch(url, { headers: { "Accept": "application/json" } });
          if (!res.ok) continue;
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const hit = data[0];
            const lat = parseFloat(hit.lat);
            const lon = parseFloat(hit.lon);
            let bbox: [number, number, number, number] | undefined;
            if (Array.isArray(hit.boundingbox) && hit.boundingbox.length === 4) {
              const [s, n, w, e] = hit.boundingbox.map((v: string) => parseFloat(v));
              bbox = [w, s, e, n];
            }
            if (!cancelled && Number.isFinite(lat) && Number.isFinite(lon)) {
              setCoords({ lat, lon, bbox });
            }
            break;
          }
        } catch {
          // try next candidate
        }
      }
      if (!cancelled) setGeocoding(false);
    })();

    return () => { cancelled = true; };
  }, [mapOpen, coords, queryString, tour.destination, tour.location, tour.country]);

  // Map-URL: bei bekannten Koordinaten präzise bbox + Marker, sonst Freitextsuche-Fallback
  const osmEmbedUrl = (() => {
    if (coords) {
      const marker = `&marker=${coords.lat}%2C${coords.lon}`;
      if (coords.bbox) {
        const [w, s, e, n] = coords.bbox;
        return `https://www.openstreetmap.org/export/embed.html?bbox=${w}%2C${s}%2C${e}%2C${n}&layer=mapnik${marker}`;
      }
      // Fallback: ~0.05° Box um den Punkt (≈ Stadtzoom)
      const d = 0.04;
      return `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lon - d}%2C${coords.lat - d}%2C${coords.lon + d}%2C${coords.lat + d}&layer=mapnik${marker}`;
    }
    return `https://www.openstreetmap.org/export/embed.html?layer=mapnik&search=${mapQuery}`;
  })();

  // Build gallery from available images
  const allImages: string[] = [];
  if (tour.hero_image_url) allImages.push(tour.hero_image_url);
  if (tour.image_url && tour.image_url !== tour.hero_image_url) allImages.push(tour.image_url);
  if (tour.gallery_images && tour.gallery_images.length > 0) {
    tour.gallery_images.forEach(img => {
      if (img && !allImages.includes(img)) allImages.push(img);
    });
  }
  // Pad with hero fallback if needed
  while (allImages.length < 5) {
    allImages.push(heroImage);
  }

  const mainImage = allImages[0] || heroImage;
  const sideImages = allImages.slice(1, 5);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Rating data (could come from DB in future)
  const rating = 8.7;
  const ratingLabel = rating >= 9 ? "Ausgezeichnet" : rating >= 8 ? "Hervorragend" : rating >= 7 ? "Sehr gut" : "Gut";
  const reviewCount = 312;
  const subscores = [
    { label: "Lage", score: 9.1 },
    { label: "Komfort", score: 8.8 },
    { label: "Preis/Leistung", score: 8.5 },
  ];

  return (
    <section>
      {/* Breadcrumb */}
      <div className="bg-card border-b border-border">
        <div className="max-w-[1240px] mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Startseite</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/reisen" className="hover:text-primary transition-colors">Pauschalreisen</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">{tour.destination}</span>
          </nav>
        </div>
      </div>

      {/* Title Bar */}
      <div className="bg-card border-b border-border">
        <div className="max-w-[1240px] mx-auto px-4 py-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {tour.is_featured && (
                  <Badge className="bg-primary text-primary-foreground text-xs gap-1">
                    <BadgeCheck className="w-3 h-3" /> Top-Empfehlung
                  </Badge>
                )}
                {tour.discount_percent && tour.discount_percent > 0 && (
                  <Badge variant="destructive" className="text-xs">−{tour.discount_percent}% Frühbucher</Badge>
                )}
                {tour.category && (
                  <Badge variant="secondary" className="text-xs">{tour.category}</Badge>
                )}
              </div>

              <h1 className="text-2xl md:text-[2rem] font-bold text-foreground leading-tight tracking-tight mb-2">
                {tour.destination}
                <span className="text-muted-foreground font-medium"> · {tour.duration_days} Tage</span>
              </h1>

              {/* Hotel-Style: Sonnen-Sterne · Adresse · Karte anzeigen */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm mb-3">
                <div className="flex items-center gap-0.5" aria-label="5 Sterne Komfort">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Sun key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-border">|</span>
                <span className="flex items-center gap-1.5 text-foreground">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {tour.location}{tour.country ? `, ${tour.country}` : ''}
                </span>
                <span className="text-muted-foreground">·</span>
                <button
                  type="button"
                  className="text-primary hover:underline font-medium"
                  onClick={() => setMapOpen(true)}
                >
                  Karte anzeigen
                </button>
              </div>

              {/* Inklusiv-Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1">
                  <Bus className="w-3.5 h-3.5 text-primary" /> Komfort-Bus inkl.
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1">
                  <Hotel className="w-3.5 h-3.5 text-primary" /> Hotel inkl.
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1">
                  <Coffee className="w-3.5 h-3.5 text-primary" /> Frühstück inkl.
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 border border-border rounded-full px-2.5 py-1">
                  <Clock className="w-3.5 h-3.5" /> {tour.duration_days} Tage / {Math.max((tour.duration_days || 1) - 1, 0)} Nächte
                </span>
              </div>
            </div>

            {/* Actions + Rating */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Share2 className="w-4 h-4" /> Teilen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setIsSaved(!isSaved)}
                >
                  <Heart className={`w-4 h-4 ${isSaved ? 'fill-destructive text-destructive' : ''}`} /> Merken
                </Button>
              </div>

              {/* Rating Badge */}
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-foreground">{ratingLabel}</p>
                  <p className="text-xs text-muted-foreground">{reviewCount} Bewertungen</p>
                </div>
                <div className="w-11 h-11 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-md shadow-primary/30">
                  {rating}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="max-w-[1240px] mx-auto px-4 pt-4">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[300px] md:h-[420px] rounded-xl overflow-hidden">
          {/* Main large image */}
          <div
            className="col-span-2 row-span-2 relative cursor-pointer group"
            onClick={() => openLightbox(0)}
          >
            <img src={mainImage} alt={tour.destination} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>

          {/* 4 smaller images */}
          {sideImages.map((img, i) => (
            <div
              key={i}
              className="relative cursor-pointer group overflow-hidden"
              onClick={() => openLightbox(i + 1)}
            >
              <img src={img} alt={`${tour.destination} ${i + 2}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

              {/* "Show all photos" overlay on last image */}
              {i === 3 && allImages.length > 5 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Button variant="secondary" size="sm" className="gap-1.5 bg-white/90 text-foreground hover:bg-white">
                    <Images className="w-4 h-4" />
                    Alle Fotos ({allImages.length})
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Show all photos button (mobile) */}
        <div className="flex justify-end mt-2 md:hidden">
          <Button variant="outline" size="sm" onClick={() => openLightbox(0)} className="gap-1.5 text-xs">
            <Images className="w-3.5 h-3.5" />
            Alle Fotos anzeigen
          </Button>
        </div>
      </div>

      {/* Review Subscores Bar */}
      <div className="max-w-[1240px] mx-auto px-4 mt-4">
        <div className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Main Score */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl">
              {rating}
            </div>
            <div>
              <p className="font-bold text-foreground text-lg">{ratingLabel}</p>
              <p className="text-sm text-muted-foreground">{reviewCount} Bewertungen</p>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-10 bg-border" />

          {/* Subscores */}
          <div className="flex flex-1 gap-6">
            {subscores.map((sub) => (
              <div key={sub.label} className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">{sub.label}</span>
                  <span className="text-sm font-semibold text-foreground">{sub.score}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(sub.score / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Button variant="outline" size="sm" className="shrink-0 text-xs">
            Bewertungen lesen
          </Button>
        </div>
      </div>

      {/* Short description */}
      {tour.short_description && (
        <div className="max-w-[1240px] mx-auto px-4 mt-4">
          <p className="text-muted-foreground text-sm">{tour.short_description}</p>
        </div>
      )}

      {/* Map Dialog – zeigt Reiseziel auf OpenStreetMap */}
      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-5 h-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{tour.destination}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {tour.location}{tour.country ? `, ${tour.country}` : ''}
                </p>
              </div>
            </div>
            <a
              href={osmFullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline font-medium shrink-0 ml-3"
            >
              In Karte öffnen ↗
            </a>
          </div>
          <div className="relative">
            {geocoding && !coords && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/60 backdrop-blur-sm">
                <span className="text-xs text-muted-foreground">Standort wird ermittelt …</span>
              </div>
            )}
            <iframe
              key={osmEmbedUrl}
              title={`Karte ${tour.destination}`}
              src={osmEmbedUrl}
              className="w-full h-[70vh] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl p-0 bg-black border-0">
          <div className="relative">
            <img
              src={allImages[lightboxIndex] || heroImage}
              alt={`${tour.destination} Foto ${lightboxIndex + 1}`}
              className="w-full max-h-[80vh] object-contain"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="w-6 h-6" />
            </Button>
            {allImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={() => setLightboxIndex((lightboxIndex - 1 + allImages.length) % allImages.length)}
                >
                  <ChevronLeftIcon className="w-8 h-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={() => setLightboxIndex((lightboxIndex + 1) % allImages.length)}
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </>
            )}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
              {lightboxIndex + 1} / {allImages.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default TourHeroSection;
