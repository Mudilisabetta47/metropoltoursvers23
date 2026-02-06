import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  MapPin, Calendar, Users, Star, Check, 
  ChevronLeft, Phone, Mail, ArrowRight, X,
  Palmtree, Hotel, Bus, Camera, Ticket, CircleArrowRight, CircleArrowLeft, Loader2
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
import { useAuth } from "@/hooks/useAuth";
import { usePackageTour, PackageTour } from "@/hooks/useCMS";
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
  const [inquiryNumber, setInquiryNumber] = useState<string | null>(null);

  const getImageSrc = (tour: PackageTour) => {
    if (tour.image_url && imageMap[tour.image_url]) {
      return imageMap[tour.image_url];
    }
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
    setIsSubmitting(true);
    
    try {
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
          <img
            src={getImageSrc(dbTour)}
            alt={dbTour.destination}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
            <div className="container mx-auto">
              <Button
                variant="ghost"
                className="text-white mb-4 hover:bg-white/20"
                onClick={() => navigate("/")}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Zurück
              </Button>
              
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge className="bg-primary text-primary-foreground">
                  <Palmtree className="w-3 h-3 mr-1" />
                  Pauschalreise
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  {dbTour.duration_days} Tage
                </Badge>
                {dbTour.discount_percent > 0 && (
                  <Badge className="bg-accent text-accent-foreground">
                    -{dbTour.discount_percent}% Rabatt
                  </Badge>
                )}
              </div>
              
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
                {dbTour.destination}
              </h1>
              <div className="flex items-center gap-2 text-white/90 text-lg">
                <MapPin className="w-5 h-5" />
                {dbTour.location}
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column - Tour Details */}
              <div className="lg:col-span-2 space-y-8">
                {/* Quick Info */}
                <Card>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Dauer</div>
                          <div className="font-semibold">{dbTour.duration_days} Tage</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <CircleArrowRight className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Hinreise</div>
                          <div className="font-semibold">{formatDate(dbTour.departure_date)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <CircleArrowLeft className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Rückreise</div>
                          <div className="font-semibold">{formatDate(dbTour.return_date)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
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
                <Card>
                  <CardHeader>
                    <CardTitle>Über diese Reise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {dbTour.description || `Entdecken Sie ${dbTour.destination} auf dieser ${dbTour.duration_days}-tägigen Reise. ${dbTour.location} erwartet Sie mit unvergesslichen Erlebnissen.`}
                    </p>
                    
                    {dbTour.highlights && dbTour.highlights.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {dbTour.highlights.map((highlight) => (
                          <Badge key={highlight} variant="secondary">
                            {highlight}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Itinerary */}
                {itinerary.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Reiseverlauf</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {itinerary.map((day, index) => (
                          <div key={index} className="flex gap-4">
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
                <Card>
                  <CardHeader>
                    <CardTitle>Im Preis enthalten</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {includedServices.map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <h4 className="font-medium mb-2 text-muted-foreground">Nicht enthalten:</h4>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {defaultNotIncluded.map((item) => (
                        <div key={item} className="flex items-center gap-2 text-muted-foreground">
                          <X className="w-4 h-4 shrink-0" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Booking Form */}
              <div className="lg:col-span-1">
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
                          
                          <Button 
                            type="submit" 
                            className="w-full" 
                            size="lg"
                            disabled={isSubmitting}
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
                          +49 40 123 456 789
                        </a>
                        <a 
                          href="mailto:reisen@metropol-tours.de"
                          className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          reisen@metropol-tours.de
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
