import { useState } from "react";
import { 
  School, Users, MapPin, Trophy, Plane, PartyPopper,
  Phone, Mail, Send, CheckCircle, ArrowRight, Building2, Loader2,
  Shield, Clock, Star, Bus, Calendar, MapPinned, MessageSquare
} from "lucide-react";
import { motion } from "framer-motion";
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
  School, Users, MapPin, Trophy, Plane, PartyPopper,
};

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

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const }
  })
};

const BusinessServicesPage = () => {
  const { toast } = useToast();
  const { services, isLoading } = useServiceTypes();
  
  const [formData, setFormData] = useState({
    service: "",
    company: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    participants: "",
    date: "",
    returnDate: "",
    pickup: "",
    destination: "",
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
          destination: formData.destination || selectedService?.name || formData.service,
          first_name: formData.firstName,
          last_name: formData.lastName || '-',
          email: formData.email,
          phone: formData.phone || null,
          participants: parseInt(formData.participants) || 1,
          departure_date: formData.date || 'Nach Vereinbarung',
          message: [
            formData.company && `Firma: ${formData.company}`,
            formData.pickup && `Abfahrtsort: ${formData.pickup}`,
            formData.destination && `Zielort: ${formData.destination}`,
            formData.returnDate && `Rückreise: ${formData.returnDate}`,
            formData.message
          ].filter(Boolean).join('\n'),
          total_price: 0,
          status: 'pending'
        });

      if (error) throw error;

      // Also send to admin mailbox
      await supabase.from('admin_mailbox').insert({
        subject: `Gruppenanfrage: ${selectedService?.name || formData.service}`,
        body: [
          `Service: ${selectedService?.name || formData.service}`,
          `Name: ${formData.firstName} ${formData.lastName}`,
          formData.company && `Firma: ${formData.company}`,
          `E-Mail: ${formData.email}`,
          formData.phone && `Telefon: ${formData.phone}`,
          `Teilnehmer: ${formData.participants || 'k.A.'}`,
          formData.date && `Hinfahrt: ${formData.date}`,
          formData.returnDate && `Rückfahrt: ${formData.returnDate}`,
          formData.pickup && `Abfahrtsort: ${formData.pickup}`,
          formData.destination && `Zielort: ${formData.destination}`,
          `\nNachricht:\n${formData.message}`
        ].filter(Boolean).join('\n'),
        sender_name: `${formData.firstName} ${formData.lastName}`,
        sender_email: formData.email,
        source_type: 'group_inquiry',
        folder: 'inbox',
        tags: ['gruppenanfrage', selectedService?.slug || 'sonstiges']
      });

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
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pt-20 lg:pt-24">
        {/* Hero Section — Cinematic */}
        <section className="relative bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 py-24 lg:py-36 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.03)_0%,transparent_60%)]" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              className="max-w-3xl"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-5 py-2.5 text-white/80 text-sm mb-8">
                <Building2 className="w-4 h-4 text-primary" />
                Geschäftskunden & Gruppen
              </div>
              <h1 className="text-4xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
                Professionelle<br />
                <span className="text-primary">Bus-Services</span> für<br />
                jeden Anlass
              </h1>
              <p className="text-lg lg:text-xl text-zinc-400 mb-10 leading-relaxed max-w-xl">
                Von Schulfahrten bis Eventfahrten – METROPOL TOURS ist Ihr zuverlässiger Partner für individuelle Transportlösungen.
              </p>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="#anfrage" 
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-7 py-3.5 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  Kostenlos anfragen
                  <ArrowRight className="w-5 h-5" />
                </a>
                <a 
                  href="tel:+4940123456789" 
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/15 transition-all"
                >
                  <Phone className="w-5 h-5" />
                  +49 40 123 456 789
                </a>
              </div>
            </motion.div>
          </div>

          {/* Trust strip */}
          <div className="container mx-auto px-4 mt-16 relative z-10">
            <div className="flex flex-wrap items-center gap-8 text-zinc-500 text-sm">
              {[
                { icon: Shield, text: "SSL-gesichert" },
                { icon: Clock, text: "Antwort in 24h" },
                { icon: Star, text: "4.9/5 Bewertung" },
                { icon: Bus, text: "50+ moderne Busse" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 text-primary/60" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services Grid — Modern Cards */}
        <section className="py-20 lg:py-28">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center max-w-2xl mx-auto mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
                Unsere Reisearten
              </h2>
              <p className="text-lg text-muted-foreground">
                Maßgeschneiderte Transportlösungen für Unternehmen, Vereine, Schulen und Privatpersonen
              </p>
            </motion.div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service, index) => {
                  const IconComponent = iconMap[service.icon] || Users;
                  const features = service.features?.length > 0 
                    ? service.features 
                    : serviceFeaturesMap[service.slug] || [];

                  return (
                    <motion.div
                      key={service.id}
                      custom={index}
                      variants={fadeUp}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                    >
                      <Card className="group h-full border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden">
                        <CardContent className="p-0">
                          {/* Card header gradient */}
                          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 pb-6">
                            <div className="w-14 h-14 bg-primary/15 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                              <IconComponent className="w-7 h-7 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">
                              {service.name}
                            </h3>
                            {service.highlight && (
                              <span className="inline-block text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                                {service.highlight}
                              </span>
                            )}
                          </div>
                          
                          <div className="px-8 pb-8">
                            <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                              {service.description}
                            </p>
                            
                            {features.length > 0 && (
                              <ul className="space-y-2 mb-6">
                                {features.slice(0, 4).map((feature) => (
                                  <li key={feature} className="flex items-start gap-2 text-sm">
                                    <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <span className="text-foreground/80">{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            )}

                            <a 
                              href="#anfrage"
                              onClick={() => setFormData(prev => ({ ...prev, service: service.slug }))}
                              className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:gap-3 transition-all"
                            >
                              Angebot anfordern
                              <ArrowRight className="w-4 h-4" />
                            </a>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Stats Strip */}
        <section className="py-16 bg-zinc-900">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: "50+", label: "Moderne Busse", icon: Bus },
                { value: "100k+", label: "Zufriedene Kunden", icon: Users },
                { value: "24/7", label: "Erreichbarkeit", icon: Clock },
                { value: "4.9★", label: "Kundenbewertung", icon: Star },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="flex flex-col items-center"
                >
                  <stat.icon className="w-6 h-6 text-primary/60 mb-3" />
                  <div className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-zinc-400 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form — Premium Redesign */}
        <section id="anfrage" className="py-20 lg:py-28">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <motion.div 
                className="text-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-2 rounded-full mb-4">
                  <MessageSquare className="w-4 h-4" />
                  Kostenlos & unverbindlich
                </div>
                <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
                  Gruppenanfrage stellen
                </h2>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                  Beschreiben Sie Ihre Reise — wir erstellen Ihnen ein maßgeschneidertes Angebot
                </p>
              </motion.div>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="p-12 text-center border-primary/20 bg-primary/5">
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">
                      Vielen Dank für Ihre Anfrage!
                    </h3>
                    <p className="text-muted-foreground mb-2">
                      Anfrage-Nr. wurde erstellt und in unserem System gespeichert.
                    </p>
                    <p className="text-muted-foreground mb-8">
                      Wir melden uns innerhalb von <span className="text-primary font-semibold">24 Stunden</span> bei Ihnen.
                    </p>
                    <Button onClick={() => setSubmitted(false)} variant="outline" size="lg">
                      Weitere Anfrage stellen
                    </Button>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <Card className="border-border/50 shadow-xl">
                    <CardContent className="p-0">
                      {/* Form header */}
                      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 border-b border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
                            <Send className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">Anfrage-Formular</h3>
                            <p className="text-sm text-muted-foreground">Füllen Sie die Felder aus — wir kümmern uns um den Rest</p>
                          </div>
                        </div>
                      </div>

                      <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        {/* Section 1: Service Selection */}
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</div>
                            <h4 className="font-semibold text-foreground">Art der Reise</h4>
                          </div>
                          <Select 
                            value={formData.service}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, service: value }))}
                            required
                          >
                            <SelectTrigger className="h-12 text-foreground">
                              <SelectValue placeholder="Bitte wählen Sie einen Service..." />
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

                        {/* Section 2: Route & Dates */}
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">2</div>
                            <h4 className="font-semibold text-foreground">Route & Termine</h4>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="pickup" className="text-sm text-muted-foreground">Abfahrtsort</Label>
                              <div className="relative mt-1.5">
                                <MapPinned className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  id="pickup"
                                  value={formData.pickup}
                                  onChange={(e) => setFormData(prev => ({ ...prev, pickup: e.target.value }))}
                                  placeholder="z.B. Hamburg ZOB"
                                  className="pl-10 h-12 text-foreground"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="destination" className="text-sm text-muted-foreground">Zielort</Label>
                              <div className="relative mt-1.5">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  id="destination"
                                  value={formData.destination}
                                  onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                                  placeholder="z.B. Berlin Alexanderplatz"
                                  className="pl-10 h-12 text-foreground"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="date" className="text-sm text-muted-foreground">Hinfahrt</Label>
                              <div className="relative mt-1.5">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  id="date"
                                  type="date"
                                  value={formData.date}
                                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                  className="pl-10 h-12 text-foreground"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="returnDate" className="text-sm text-muted-foreground">Rückfahrt (optional)</Label>
                              <div className="relative mt-1.5">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  id="returnDate"
                                  type="date"
                                  value={formData.returnDate}
                                  onChange={(e) => setFormData(prev => ({ ...prev, returnDate: e.target.value }))}
                                  className="pl-10 h-12 text-foreground"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="participants" className="text-sm text-muted-foreground">Teilnehmeranzahl</Label>
                              <div className="relative mt-1.5">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  id="participants"
                                  type="number"
                                  min="1"
                                  value={formData.participants}
                                  onChange={(e) => setFormData(prev => ({ ...prev, participants: e.target.value }))}
                                  placeholder="z.B. 30"
                                  className="pl-10 h-12 text-foreground"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section 3: Contact Info */}
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">3</div>
                            <h4 className="font-semibold text-foreground">Kontaktdaten</h4>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="firstName" className="text-sm text-muted-foreground">Vorname *</Label>
                              <Input
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                placeholder="Max"
                                required
                                className="mt-1.5 h-12 text-foreground"
                              />
                            </div>
                            <div>
                              <Label htmlFor="lastName" className="text-sm text-muted-foreground">Nachname *</Label>
                              <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                placeholder="Mustermann"
                                required
                                className="mt-1.5 h-12 text-foreground"
                              />
                            </div>
                            <div>
                              <Label htmlFor="company" className="text-sm text-muted-foreground">Firma / Organisation</Label>
                              <Input
                                id="company"
                                value={formData.company}
                                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                                placeholder="Optional"
                                className="mt-1.5 h-12 text-foreground"
                              />
                            </div>
                            <div>
                              <Label htmlFor="email" className="text-sm text-muted-foreground">E-Mail *</Label>
                              <div className="relative mt-1.5">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  id="email"
                                  type="email"
                                  value={formData.email}
                                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                  placeholder="ihre@email.de"
                                  required
                                  className="pl-10 h-12 text-foreground"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="phone" className="text-sm text-muted-foreground">Telefon</Label>
                              <div className="relative mt-1.5">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  id="phone"
                                  type="tel"
                                  value={formData.phone}
                                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                  placeholder="+49 123 456789"
                                  className="pl-10 h-12 text-foreground"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section 4: Message */}
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">4</div>
                            <h4 className="font-semibold text-foreground">Ihre Nachricht</h4>
                          </div>
                          <Textarea
                            value={formData.message}
                            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                            placeholder="Beschreiben Sie Ihre Anforderungen, besondere Wünsche, Ausstattung etc."
                            required
                            className="min-h-[140px] text-foreground"
                          />
                        </div>

                        {/* Submit */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-border/50">
                          <Button 
                            type="submit" 
                            size="lg" 
                            className="w-full sm:w-auto px-10 h-12 text-base shadow-lg shadow-primary/20"
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
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Shield className="w-4 h-4 text-primary/60" />
                            SSL-verschlüsselt · Keine Weitergabe an Dritte
                          </div>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Contact Alternatives */}
              <div className="mt-12 grid md:grid-cols-2 gap-6">
                <Card className="p-6 border-border/50 hover:border-primary/30 transition-colors">
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

                <Card className="p-6 border-border/50 hover:border-primary/30 transition-colors">
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
