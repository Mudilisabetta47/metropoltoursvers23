import { useState } from "react";
import { 
  School, Users, MapPin, Trophy, Plane, PartyPopper,
  Phone, Mail, Send, CheckCircle, ArrowRight, Building2, Loader2
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useServiceTypes } from "@/hooks/useCMS";

const iconMap: Record<string, React.ElementType> = {
  School,
  Users,
  MapPin,
  Trophy,
  Plane,
  PartyPopper,
};

// Fallback static features for each service type
const serviceFeaturesMap: Record<string, string[]> = {
  schulfahrten: [
    "Erfahrene, kinderfreundliche Fahrer",
    "Höchste Sicherheitsstandards",
    "Flexible Routenplanung",
    "Begleitung durch Lehrkräfte",
    "Attraktive Gruppenpreise"
  ],
  privatfahrten: [
    "Individuelle Routenplanung",
    "Verschiedene Busgrößen (8-50+ Plätze)",
    "Catering auf Wunsch",
    "Flexible Abfahrtszeiten",
    "Deutschlandweit & international"
  ],
  "shuttle-service": [
    "Festpreise für Regelmäßigkeit",
    "Pünktliche Abholung garantiert",
    "GPS-Tracking in Echtzeit",
    "Flexible Vertragsmodelle",
    "Klimatisierte Komfortbusse"
  ],
  vereinsfahrten: [
    "Spezielle Vereinsrabatte",
    "Gepäckraum für Ausrüstung",
    "Flexible Wartezeiten",
    "Fanartikel-Transport möglich",
    "Langstrecken bis 2.000 km"
  ],
  flughafentransfer: [
    "Transfer zu allen deutschen Flughäfen",
    "Frühbucher-Rabatte",
    "Gepäckservice inklusive",
    "Flugtracking bei Verspätungen",
    "24/7 Buchung möglich"
  ],
  eventfahrten: [
    "Shuttle-Service zu Venues",
    "VIP-Busse verfügbar",
    "Koordination mit Veranstaltern",
    "Mehrere Zustiegspunkte möglich",
    "Rücktransport garantiert"
  ]
};

const BusinessServicesPage = () => {
  const { toast } = useToast();
  const { services, isLoading } = useServiceTypes();
  
  const [formData, setFormData] = useState({
    service: "",
    company: "",
    name: "",
    email: "",
    phone: "",
    participants: "",
    date: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const inquiryNumber = `SRV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
      const selectedService = services.find(s => s.slug === formData.service);
      
      const { error } = await supabase
        .from('package_tour_inquiries')
        .insert({
          inquiry_number: inquiryNumber,
          tour_id: formData.service,
          destination: selectedService?.name || formData.service,
          first_name: formData.name.split(' ')[0],
          last_name: formData.name.split(' ').slice(1).join(' ') || '-',
          email: formData.email,
          phone: formData.phone || null,
          participants: parseInt(formData.participants) || 1,
          departure_date: formData.date || 'Nach Vereinbarung',
          message: `Firma: ${formData.company}\n\n${formData.message}`,
          total_price: 0,
          status: 'pending'
        });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Anfrage erfolgreich gesendet!",
        description: "Wir melden uns innerhalb von 24 Stunden bei Ihnen."
      });
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      toast({
        title: "Fehler beim Senden",
        description: "Bitte versuchen Sie es erneut oder rufen Sie uns an.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20 lg:pt-24">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary via-primary to-primary/80 py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 text-white/90 text-sm mb-6">
                <Building2 className="w-4 h-4" />
                Geschäftskunden & Gruppen
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Professionelle Bus-Services für jeden Anlass
              </h1>
              <p className="text-xl text-white/80 mb-8 leading-relaxed">
                Von Schulfahrten bis Eventfahrten – METROPOL TOURS ist Ihr zuverlässiger Partner für individuelle Transportlösungen. Über 20 Jahre Erfahrung im Personentransport.
              </p>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="#anfrage" 
                  className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors"
                >
                  Jetzt anfragen
                  <ArrowRight className="w-5 h-5" />
                </a>
                <a 
                  href="tel:+4940123456789" 
                  className="inline-flex items-center gap-2 bg-white/20 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/30 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  +49 40 123 456 789
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-20 lg:py-28 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Unsere Reisearten
              </h2>
              <p className="text-lg text-muted-foreground">
                Maßgeschneiderte Transportlösungen für Unternehmen, Vereine, Schulen und Privatpersonen
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-8">
                {services.map((service, index) => {
                  const IconComponent = iconMap[service.icon] || Users;
                  const features = service.features?.length > 0 
                    ? service.features 
                    : serviceFeaturesMap[service.slug] || [];

                  return (
                    <Card 
                      key={service.id} 
                      className="overflow-hidden hover:shadow-xl transition-shadow duration-300"
                    >
                      <CardContent className="p-0">
                        <div className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
                          {/* Icon/Visual Side */}
                          <div className="lg:w-1/3 bg-gradient-to-br from-primary/10 to-primary/5 p-8 lg:p-12 flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-24 h-24 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <IconComponent className="w-12 h-12 text-primary" />
                              </div>
                              <h3 className="text-2xl font-bold text-foreground mb-2">
                                {service.name}
                              </h3>
                              {service.highlight && (
                                <p className="text-primary font-medium">
                                  {service.highlight}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Content Side */}
                          <div className="lg:w-2/3 p-8 lg:p-12">
                            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                              {service.description}
                            </p>
                            
                            {features.length > 0 && (
                              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                                {features.map((feature) => (
                                  <div key={feature} className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                                    <span className="text-foreground">{feature}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <a 
                              href="#anfrage"
                              onClick={() => setFormData(prev => ({ ...prev, service: service.slug }))}
                              className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
                            >
                              Angebot anfordern
                              <ArrowRight className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl lg:text-5xl font-bold text-primary mb-2">20+</div>
                <div className="text-muted-foreground">Jahre Erfahrung</div>
              </div>
              <div>
                <div className="text-4xl lg:text-5xl font-bold text-primary mb-2">50+</div>
                <div className="text-muted-foreground">Moderne Busse</div>
              </div>
              <div>
                <div className="text-4xl lg:text-5xl font-bold text-primary mb-2">100k+</div>
                <div className="text-muted-foreground">Zufriedene Kunden</div>
              </div>
              <div>
                <div className="text-4xl lg:text-5xl font-bold text-primary mb-2">24/7</div>
                <div className="text-muted-foreground">Erreichbarkeit</div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section id="anfrage" className="py-20 lg:py-28 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                  Unverbindliche Anfrage
                </h2>
                <p className="text-lg text-muted-foreground">
                  Schildern Sie uns Ihr Anliegen – wir erstellen Ihnen ein individuelles Angebot
                </p>
              </div>

              {submitted ? (
                <Card className="p-12 text-center">
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    Vielen Dank für Ihre Anfrage!
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Wir haben Ihre Nachricht erhalten und melden uns innerhalb von 24 Stunden bei Ihnen.
                  </p>
                  <Button onClick={() => setSubmitted(false)} variant="outline">
                    Weitere Anfrage stellen
                  </Button>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <Label htmlFor="service">Gewünschter Service *</Label>
                          <Select 
                            value={formData.service}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, service: value }))}
                            required
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Bitte wählen..." />
                            </SelectTrigger>
                            <SelectContent>
                              {services.map((service) => (
                                <SelectItem key={service.slug} value={service.slug}>
                                  {service.name}
                                </SelectItem>
                              ))}
                              <SelectItem value="other">Sonstiges</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="company">Firma / Organisation</Label>
                          <Input
                            id="company"
                            value={formData.company}
                            onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                            placeholder="Firmenname (optional)"
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label htmlFor="name">Ansprechpartner *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Ihr vollständiger Name"
                            required
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label htmlFor="email">E-Mail *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="ihre@email.de"
                            required
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label htmlFor="phone">Telefon</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+49 123 456789"
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label htmlFor="participants">Teilnehmeranzahl</Label>
                          <Input
                            id="participants"
                            type="number"
                            min="1"
                            value={formData.participants}
                            onChange={(e) => setFormData(prev => ({ ...prev, participants: e.target.value }))}
                            placeholder="ca. Personenanzahl"
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label htmlFor="date">Wunschtermin</Label>
                          <Input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                            className="mt-2"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor="message">Ihre Nachricht *</Label>
                          <Textarea
                            id="message"
                            value={formData.message}
                            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                            placeholder="Beschreiben Sie Ihre Anforderungen..."
                            required
                            className="mt-2 min-h-[120px]"
                          />
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        size="lg" 
                        className="w-full md:w-auto"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Wird gesendet...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5 mr-2" />
                            Anfrage absenden
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Contact Alternatives */}
              <div className="mt-12 grid md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Telefonisch</h4>
                      <p className="text-muted-foreground text-sm mb-2">Mo-Fr 8-20 Uhr, Sa-So 9-18 Uhr</p>
                      <a href="tel:+4940123456789" className="text-primary font-medium hover:underline">
                        +49 40 123 456 789
                      </a>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Per E-Mail</h4>
                      <p className="text-muted-foreground text-sm mb-2">Antwort innerhalb von 24 Stunden</p>
                      <a href="mailto:business@metropol-tours.de" className="text-primary font-medium hover:underline">
                        business@metropol-tours.de
                      </a>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BusinessServicesPage;
