import { useState, useEffect } from "react";
import ConsentCheckbox from "@/components/common/ConsentCheckbox";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  MapPin, Calendar, Users, Star, Check, 
  ChevronLeft, ChevronRight, Clock, Phone, Mail, ArrowRight, X,
  Palmtree, Hotel, Bus, Camera, Ticket, CircleArrowRight, CircleArrowLeft, Loader2,
  Wifi, Plug, Armchair
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import TourSurroundingsSection from "@/components/tours/TourSurroundingsSection";

import { useAuth } from "@/hooks/useAuth";
import { usePackageTour, PackageTour } from "@/hooks/useCMS";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";

// Import local images as fallbacks
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
  'kroatien': tourCroatia,
  'slowenien': tourSlovenia,
  'bosnien': tourBosnia,
  'montenegro': tourMontenegro,
  'serbien': tourSerbien,
  'nordmazedonien': tourNordmazedonien,
  'albanien': tourAlbanien,
  'kosovo': tourKosovo,
};

// Default included services for tours without detailed data
const defaultIncluded = [
  "Busfahrt im modernen Reisebus",
  "Übernachtungen im Hotel",
  "Halbpension (Frühstück & Abendessen)",
  "Stadtführungen laut Programm",
  "Deutschsprachige Reiseleitung",
  "Alle Eintritte laut Programm"
];

const defaultNotIncluded = [
  "Reiseversicherung",
  "Persönliche Ausgaben",
  "Getränke zu den Mahlzeiten",
  "Optionale Ausflüge"
];

const PackageTourDetailPage = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { protect } = useRecaptcha();
  
  const { tour: dbTour, isLoading, error } = usePackageTour(tourId || '');
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    participants: 1,
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consent, setConsent] = useState(false);
  const [inquiryNumber, setInquiryNumber] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [geo, setGeo] = useState<{ lat: number; lon: number; label: string } | null>(null);

  const anyTour = dbTour as any;
  const hotelLat = Number(anyTour?.latitude);
  const hotelLon = Number(anyTour?.longitude);
  const hasHotelCoords = Number.isFinite(hotelLat) && Number.isFinite(hotelLon);

  // Genaueste verfügbare Adresse: Hoteladresse > Ort + Ziel
  const geoQuery = dbTour
    ? (anyTour?.hotel_address as string | null) ||
      `${dbTour.location || ""} ${dbTour.destination || ""}`.trim()
    : "";

  useEffect(() => {
    if (hasHotelCoords) {
      setGeo({ lat: hotelLat, lon: hotelLon, label: (anyTour?.hotel_address as string) || geoQuery });
      return;
    }
    if (!geoQuery) return;
    let active = true;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(geoQuery)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        if (!active || !Array.isArray(rows) || rows.length === 0) return;
        setGeo({ lat: parseFloat(rows[0].lat), lon: parseFloat(rows[0].lon), label: rows[0].display_name });
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [geoQuery, hasHotelCoords, hotelLat, hotelLon]);


  const getImageSrc = (tour: PackageTour) => {
    const url = tour.hero_image_url || tour.image_url;
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) return url;
    if (url && imageMap[url]) return imageMap[url];
    const fallbackKey = tour.destination.toLowerCase();
    return imageMap[fallbackKey] || tourCroatia;
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd.MM.yyyy', { locale: de });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!dbTour || error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Reise nicht gefunden</h1>
            <p className="text-muted-foreground mb-4">Diese Reise ist aktuell nicht verfügbar.</p>
            <Button onClick={() => navigate("/")}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Zurück zur Startseite
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      toast({
        title: "Zustimmung erforderlich",
        description: "Bitte akzeptieren Sie AGB und Datenschutzerklärung.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    
    try {
      const human = await protect('tour_inquiry');
      if (!human) {
        toast({ title: "Sicherheitsprüfung fehlgeschlagen", description: "Bitte erneut versuchen.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      const { data: generatedNumber, error: numberError } = await supabase
        .rpc('generate_inquiry_number' as never);

      if (numberError) throw numberError;

      const { error: insertError } = await supabase
        .from('package_tour_inquiries')
        .insert({
          inquiry_number: generatedNumber,
          tour_id: tourId?.toLowerCase() || '',
          destination: dbTour.destination,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone || null,
          participants: formData.participants,
          message: formData.message || null,
          total_price: dbTour.price_from * formData.participants,
          departure_date: formatDate(dbTour.departure_date),
          user_id: user?.id || null,
          status: 'pending'
        });

      if (insertError) throw insertError;

      setInquiryNumber(generatedNumber as string);

      supabase.functions.invoke('notify-inbox', {
        body: {
          type: 'tour_inquiry',
          subject: `Reiseanfrage ${generatedNumber} – ${dbTour.destination}`,
          body: [
            `Anfragenummer: ${generatedNumber}`,
            `Reise: ${dbTour.destination}`,
            `Abfahrt: ${formatDate(dbTour.departure_date)}`,
            `Name: ${formData.firstName} ${formData.lastName}`,
            `E-Mail: ${formData.email}`,
            formData.phone && `Telefon: ${formData.phone}`,
            `Teilnehmer: ${formData.participants}`,
            `Gesamtpreis (ca.): ${dbTour.price_from * formData.participants} €`,
            formData.message && `\nNachricht:\n${formData.message}`,
          ].filter(Boolean).join('\n'),
          from_email: formData.email,
          from_name: `${formData.firstName} ${formData.lastName}`,
          extra_cc: ['buchung@metours.de'],
        },
      }).catch((e) => console.warn('notify-inbox failed', e));

      toast({
        title: "Anfrage erfolgreich gesendet!",
        description: `Ihre Anfragenummer: ${generatedNumber}. Wir melden uns innerhalb von 24 Stunden.`,
      });
      
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        participants: 1,
        message: ""
      });
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      toast({
        title: "Fehler beim Senden",
        description: "Bitte versuchen Sie es erneut oder kontaktieren Sie uns telefonisch.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPrice = dbTour.price_from * formData.participants;
  const includedServices = dbTour.included_services?.length > 0 ? dbTour.included_services : defaultIncluded;
  const itinerary = dbTour.itinerary as { day: number; title: string; description: string }[] || [];

  const gallery = (dbTour.gallery_images || []).filter(Boolean).slice(0, 6);
  const tags = dbTour.tags || [];

  const heroSrc = getImageSrc(dbTour);
  const photos = [heroSrc, ...gallery.filter((g) => g !== heroSrc)];
  const mosaic = photos.slice(0, 3);
  const strip = photos.slice(3, 8);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-16 lg:pt-20">
        {/* Header block (Booking-Style) */}
        <section className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-6">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link to="/" className="hover:text-primary transition-colors font-medium">METROPOL TOURS</Link>
              <ChevronRight className="w-4 h-4" />
              <Link to="/reisen" className="hover:text-primary transition-colors">Pauschalreisen</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground">{dbTour.destination}</span>
            </nav>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge className="bg-primary text-primary-foreground">
                    <Palmtree className="w-3 h-3 mr-1" />Pauschalreise
                  </Badge>
                  <Badge variant="secondary">{dbTour.duration_days} Tage</Badge>
                  {dbTour.discount_percent > 0 && (
                    <Badge className="bg-accent text-accent-foreground">-{dbTour.discount_percent}% Rabatt</Badge>
                  )}
                  <div className="flex items-center gap-0.5 ml-1">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                    <span className="ml-1 text-sm text-muted-foreground">(4.8)</span>
                  </div>
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">{dbTour.destination}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary" />{dbTour.location}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" />{formatDate(dbTour.departure_date)} – {formatDate(dbTour.return_date)}</span>
                  <a href="#umgebung" className="text-primary font-medium hover:underline">Karte anzeigen</a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">ab</div>
                  <div className="text-3xl font-bold text-primary leading-none">{dbTour.price_from}€</div>
                  <div className="text-sm text-muted-foreground">pro Person</div>
                </div>
                <Button size="lg" onClick={() => document.getElementById('anfrage')?.scrollIntoView({ behavior: 'smooth' })}>
                  Verfügbarkeit anfragen
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Photo mosaic */}
        <section className="container mx-auto px-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setLightbox(0)}
              className="md:col-span-2 relative h-[240px] md:h-[440px] lg:h-[500px] rounded-2xl overflow-hidden group"
            >

              <img src={mosaic[0]} alt={`Pauschalreise ${dbTour.destination}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </button>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
              {[mosaic[1], mosaic[2]].map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => img && setLightbox(i + 1)}
                  className="relative h-[120px] md:h-[214px] lg:h-[244px] rounded-2xl overflow-hidden bg-muted group"
                >


                  {img ? (
                    <img src={img} alt={`${dbTour.destination} Eindruck ${i + 2}`} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Camera className="w-6 h-6" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {strip.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-3">
              {strip.map((img, i) => {
                const isLast = i === strip.length - 1 && photos.length > 8;
                return (
                  <button key={i} type="button" onClick={() => setLightbox(i + 3)} className="relative aspect-[4/3] rounded-xl overflow-hidden group">
                    <img src={img} alt={`${dbTour.destination} Eindruck ${i + 4}`} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    {isLast && (
                      <span className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold text-sm">
                        + {photos.length - 8} Fotos
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {dbTour.short_description && (
            <p className="text-muted-foreground max-w-3xl mt-6">{dbTour.short_description}</p>
          )}
        </section>

        {/* Lightbox */}
        {lightbox !== null && (
          <div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
            role="dialog"
            aria-label="Bildergalerie"
          >
            <button aria-label="Schließen" className="absolute top-4 right-4 text-white p-2" onClick={() => setLightbox(null)}>
              <X className="w-6 h-6" />
            </button>
            <button
              aria-label="Vorheriges Bild"
              className="absolute left-4 text-white p-2"
              onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + photos.length) % photos.length); }}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <img src={photos[lightbox]} alt={`${dbTour.destination} Foto ${lightbox + 1}`} className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
            <button
              aria-label="Nächstes Bild"
              className="absolute right-4 text-white p-2"
              onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % photos.length); }}
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>
        )}

        {/* Main Content */}
        <section className="py-10">
          <div className="container mx-auto px-4">

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column - Tour Details */}
              <div className="lg:col-span-2 space-y-8">
                {/* Quick Info */}
                <Card className="border border-border rounded-2xl">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Dauer</div>
                          <div className="font-semibold">{dbTour.duration_days} Tage</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <CircleArrowRight className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Hinreise</div>
                          <div className="font-semibold">{formatDate(dbTour.departure_date)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <CircleArrowLeft className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Rückreise</div>
                          <div className="font-semibold">{formatDate(dbTour.return_date)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Max. Teilnehmer</div>
                          <div className="font-semibold">{dbTour.max_participants}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                <Card className="border border-border rounded-2xl">
                  <CardHeader>
                    <CardTitle>Über diese Reise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {dbTour.description || `Entdecken Sie ${dbTour.destination} auf dieser ${dbTour.duration_days}-tägigen Reise. ${dbTour.location} erwartet Sie mit unvergesslichen Erlebnissen.`}
                    </p>

                    {(tags.length > 0 || (dbTour.highlights && dbTour.highlights.length > 0)) && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {[...(dbTour.highlights || []), ...tags].map((tag, i) => (
                          <span
                            key={`${tag}-${i}`}
                            className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1.5 text-sm font-medium"
                          >
                            #{String(tag).replace(/^#/, "").replace(/\s+/g, "")}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Gallery */}
                {gallery.length > 0 && (
                  <Card className="border border-border rounded-2xl overflow-hidden">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Camera className="w-5 h-5 text-primary" />
                        Impressionen
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {gallery.map((img, i) => (
                          <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden group">
                            <img
                              src={img}
                              alt={`${dbTour.destination} Eindruck ${i + 1}`}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Itinerary */}
                {itinerary.length > 0 && (
                  <Card className="border border-border rounded-2xl">
                    <CardHeader>
                      <CardTitle>Reiseverlauf</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {itinerary.map((day, index) => (
                          <div key={index} className="flex gap-4 p-4 rounded-xl bg-muted/40">
                            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                              {day.day}
                            </div>
                            <div>
                              <h4 className="font-semibold">{day.title}</h4>
                              <p className="text-sm text-muted-foreground">{day.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Included Services */}
                <Card className="border border-border rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      Inklusive Leistungen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {includedServices.map((item) => (
                        <div key={item} className="flex items-center gap-3 p-3 rounded-xl bg-primary/5">
                          <Check className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-6" />

                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                      <X className="w-4 h-4" /> Nicht enthalten
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {defaultNotIncluded.map((item) => (
                        <div key={item} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                          <X className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Reisekomfort */}
                <Card className="border border-primary/20 rounded-2xl bg-primary/5">
                  <CardContent className="p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <Bus className="w-5 h-5 text-primary" />Reisekomfort
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[{ icon: Wifi, label: "WLAN" }, { icon: Plug, label: "Steckdosen" }, { icon: Armchair, label: "Komfortsitze" }, { icon: Hotel, label: "Hotel inkl." }].map((c) => (
                        <div key={c.label} className="flex items-center gap-2">
                          <c.icon className="w-5 h-5 text-primary" />
                          <span className="text-sm">{c.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Umgebung / Lage – dynamisch anhand der echten Hotelposition */}
                <TourSurroundingsSection
                  destination={dbTour.destination}
                  location={dbTour.location}
                  country={dbTour.country}
                  lat={geo?.lat}
                  lon={geo?.lon}
                  hotelName={anyTour?.hotel_name || null}
                  hotelAddress={anyTour?.hotel_address || geo?.label || null}
                />
              </div>


              {/* Right Column - Booking Form */}
              <div id="anfrage" className="lg:col-span-1 scroll-mt-24">

                <div className="sticky top-24">
                  <Card className="border-primary/20">
                    <CardHeader className="bg-primary/5 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-2xl text-primary">
                            ab {dbTour.price_from}€
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">pro Person</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {inquiryNumber ? (
                        <div className="text-center py-6">
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Ticket className="w-8 h-8 text-primary" />
                          </div>
                          <h3 className="text-xl font-bold mb-2">Anfrage gesendet!</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Ihre Anfragenummer:
                          </p>
                          <Badge className="text-lg px-4 py-2">{inquiryNumber}</Badge>
                          <p className="text-sm text-muted-foreground mt-4">
                            Wir melden uns innerhalb von 24 Stunden bei Ihnen.
                          </p>
                          <Button 
                            variant="outline" 
                            className="mt-4"
                            onClick={() => setInquiryNumber(null)}
                          >
                            Neue Anfrage
                          </Button>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="firstName">Vorname *</Label>
                              <Input
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                required
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="lastName">Nachname *</Label>
                              <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                required
                                className="mt-1"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="email">E-Mail *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                              required
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="phone">Telefon</Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="participants">Teilnehmer</Label>
                            <Input
                              id="participants"
                              type="number"
                              min="1"
                              max={dbTour.max_participants}
                              value={formData.participants}
                              onChange={(e) => setFormData(prev => ({ ...prev, participants: parseInt(e.target.value) || 1 }))}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="message">Nachricht (optional)</Label>
                            <Textarea
                              id="message"
                              value={formData.message}
                              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                              className="mt-1"
                              rows={3}
                              placeholder="Besondere Wünsche oder Fragen..."
                            />
                          </div>
                          
                          <Separator />
                          
                          <div className="flex items-center justify-between font-semibold">
                            <span>Gesamtpreis (ca.)</span>
                            <span className="text-xl text-primary">{totalPrice}€</span>
                          </div>
                          
                          <ConsentCheckbox
                            id="tour-inquiry-consent"
                            checked={consent}
                            onChange={setConsent}
                            purpose="Anfrage"
                          />

                          <Button 
                            type="submit" 
                            className="w-full" 
                            size="lg"
                            disabled={isSubmitting || !consent}
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Wird gesendet...
                              </>
                            ) : (
                              <>
                                Unverbindlich anfragen
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </>
                            )}
                          </Button>
                          
                          <p className="text-xs text-muted-foreground text-center">
                            Unverbindliche Anfrage – Sie erhalten ein detailliertes Angebot per E-Mail
                          </p>
                        </form>
                      )}
                    </CardContent>
                  </Card>

                  {/* Contact Card */}
                  <Card className="mt-4">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        Haben Sie Fragen? Wir beraten Sie gerne!
                      </p>
                      <div className="space-y-2">
                        <a 
                          href="tel:+4940123456789"
                          className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          +49 511 80781106
                        </a>
                        <a 
                          href="mailto:reisen@metours.de"
                          className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          reisen@metours.de
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PackageTourDetailPage;
