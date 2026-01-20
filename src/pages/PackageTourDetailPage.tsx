import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  MapPin, Calendar, Clock, Users, Star, Check, 
  ChevronLeft, Phone, Mail, ArrowRight,
  Palmtree, Hotel, Bus, Camera
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

const packageToursData: Record<string, {
  destination: string;
  location: string;
  duration: string;
  price: number;
  image: string;
  gallery: string[];
  highlights: string[];
  description: string;
  included: string[];
  notIncluded: string[];
  itinerary: { day: number; title: string; description: string }[];
  hotelInfo: { name: string; stars: number; features: string[] };
  departureDate: string;
  maxParticipants: number;
}> = {
  kroatien: {
    destination: "Kroatien",
    location: "Dalmatinische Küste",
    duration: "7 Tage",
    price: 299,
    image: "https://images.unsplash.com/photo-1555990538-1e6c89d6a4c7?w=1200&h=600&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1555990538-1e6c89d6a4c7?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1534695215921-52f8a19e7909?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&h=400&fit=crop",
    ],
    highlights: ["Strand", "Altstadt Dubrovnik", "Meeresfrüchte", "Inselhopping"],
    description: "Erleben Sie die atemberaubende Schönheit der dalmatinischen Küste auf dieser 7-tägigen Traumreise. Von den historischen Mauern Dubrovniks bis zu den kristallklaren Gewässern der Adria – diese Reise bietet unvergessliche Momente. Genießen Sie frische Meeresfrüchte in malerischen Hafenstädtchen und entspannen Sie an den schönsten Stränden Kroatiens.",
    included: [
      "Busfahrt im modernen Reisebus",
      "6 Übernachtungen im 4-Sterne-Hotel",
      "Halbpension (Frühstück & Abendessen)",
      "Stadtführung Dubrovnik",
      "Bootsausflug zu den Elaphiten-Inseln",
      "Deutschsprachige Reiseleitung",
      "Alle Eintritte laut Programm"
    ],
    notIncluded: [
      "Reiseversicherung",
      "Persönliche Ausgaben",
      "Getränke zu den Mahlzeiten",
      "Optionale Ausflüge"
    ],
    itinerary: [
      { day: 1, title: "Anreise nach Split", description: "Abfahrt am frühen Morgen. Fahrt durch Österreich und Slowenien. Ankunft in Split am Abend, Check-in und Willkommensabendessen." },
      { day: 2, title: "Split Stadtbesichtigung", description: "Geführte Tour durch den Diokletianpalast und die Altstadt. Nachmittag zur freien Verfügung an der Promenade Riva." },
      { day: 3, title: "Ausflug nach Trogir", description: "Besuch der UNESCO-Weltkulturerbe-Stadt Trogir. Mittagessen in einem traditionellen Konoba-Restaurant." },
      { day: 4, title: "Weiterfahrt nach Dubrovnik", description: "Malerische Küstenfahrt entlang der Makarska Riviera. Ankunft in Dubrovnik und Check-in." },
      { day: 5, title: "Dubrovnik Erkundung", description: "Stadtmauer-Rundgang und Besichtigung der Altstadt. Game of Thrones Drehorte Tour optional." },
      { day: 6, title: "Inselausflug Elaphiten", description: "Ganztägiger Bootsausflug zu den Elaphiten-Inseln Koločep, Lopud und Šipan. Schwimmen und Mittagessen an Bord." },
      { day: 7, title: "Heimreise", description: "Frühstück und Abreise. Rückfahrt mit Pausen und Ankunft am späten Abend." }
    ],
    hotelInfo: {
      name: "Hotel Lero Dubrovnik",
      stars: 4,
      features: ["Pool", "Meerblick", "Klimaanlage", "WLAN", "Restaurant", "Bar"]
    },
    departureDate: "15.06.2025",
    maxParticipants: 45
  },
  slowenien: {
    destination: "Slowenien",
    location: "Bled & Ljubljana",
    duration: "5 Tage",
    price: 249,
    image: "https://images.unsplash.com/photo-1586976053146-6c82d6a77e35?w=1200&h=600&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1586976053146-6c82d6a77e35?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1570831739435-6601aa3fa4fb?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1568315827888-90e7d7b81e9f?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=600&h=400&fit=crop",
    ],
    highlights: ["Bleder See", "Vintgar-Klamm", "Ljubljana", "Kulinarik"],
    description: "Entdecken Sie das grüne Herz Europas auf dieser 5-tägigen Reise durch Slowenien. Der märchenhafte Bleder See mit seiner Inselkirche, die lebendige Hauptstadt Ljubljana und die spektakuläre Vintgar-Klamm erwarten Sie. Genießen Sie slowenische Spezialitäten und die herzliche Gastfreundschaft dieses kleinen, aber vielfältigen Landes.",
    included: [
      "Busfahrt im modernen Reisebus",
      "4 Übernachtungen im 3-Sterne-Hotel",
      "Halbpension (Frühstück & Abendessen)",
      "Stadtführung Ljubljana",
      "Eintritt Vintgar-Klamm",
      "Bootsfahrt zur Insel Bled",
      "Deutschsprachige Reiseleitung"
    ],
    notIncluded: [
      "Reiseversicherung",
      "Persönliche Ausgaben",
      "Getränke zu den Mahlzeiten"
    ],
    itinerary: [
      { day: 1, title: "Anreise nach Bled", description: "Entspannte Anreise durch Österreich. Ankunft in Bled am Nachmittag. Erste Erkundung des Sees." },
      { day: 2, title: "Bleder See & Burg", description: "Bootsfahrt zur Insel mit der Marienkirche. Nachmittags Besichtigung der Burg Bled mit Panoramablick." },
      { day: 3, title: "Vintgar-Klamm", description: "Wanderung durch die spektakuläre Vintgar-Klamm. Nachmittag zur freien Verfügung." },
      { day: 4, title: "Ljubljana Ausflug", description: "Ganztagesausflug in die Hauptstadt. Geführte Stadtbesichtigung und Zeit zum Shoppen." },
      { day: 5, title: "Heimreise", description: "Frühstück und gemütliche Rückfahrt." }
    ],
    hotelInfo: {
      name: "Hotel Jelovica Bled",
      stars: 3,
      features: ["Seeblick", "Restaurant", "WLAN", "Parkplatz"]
    },
    departureDate: "22.05.2025",
    maxParticipants: 40
  },
  bosnien: {
    destination: "Bosnien",
    location: "Sarajevo & Mostar",
    duration: "4 Tage",
    price: 199,
    image: "https://images.unsplash.com/photo-1590850558561-f2e6fa23fb7f?w=1200&h=600&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1590850558561-f2e6fa23fb7f?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1555990538-1e6c89d6a4c7?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1568315827888-90e7d7b81e9f?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=600&h=400&fit=crop",
    ],
    highlights: ["Alte Brücke Mostar", "Baščaršija", "Geschichte", "Ćevapi"],
    description: "Tauchen Sie ein in die faszinierende Geschichte und Kultur Bosniens. Von der berühmten Alten Brücke in Mostar bis zu den historischen Gassen Sarajevos – diese Reise zeigt Ihnen die Schönheit und Resilienz dieses besonderen Landes. Probieren Sie traditionelle Ćevapi und erleben Sie die legendäre Gastfreundschaft des Balkans.",
    included: [
      "Busfahrt im modernen Reisebus",
      "3 Übernachtungen im 3-Sterne-Hotel",
      "Halbpension (Frühstück & Abendessen)",
      "Stadtführung Sarajevo",
      "Stadtführung Mostar",
      "Deutschsprachige Reiseleitung"
    ],
    notIncluded: [
      "Reiseversicherung",
      "Persönliche Ausgaben",
      "Getränke zu den Mahlzeiten"
    ],
    itinerary: [
      { day: 1, title: "Anreise nach Sarajevo", description: "Anreise durch Kroatien. Ankunft in Sarajevo am Nachmittag. Willkommensabendessen." },
      { day: 2, title: "Sarajevo Erkundung", description: "Geführte Tour durch die Altstadt Baščaršija. Besuch des Tunnel der Hoffnung." },
      { day: 3, title: "Ausflug nach Mostar", description: "Fahrt nach Mostar. Besichtigung der Alten Brücke und der Altstadt. Rückkehr nach Sarajevo." },
      { day: 4, title: "Heimreise", description: "Frühstück und Heimreise mit schönen Erinnerungen." }
    ],
    hotelInfo: {
      name: "Hotel Hollywood Sarajevo",
      stars: 3,
      features: ["Zentrale Lage", "Restaurant", "WLAN", "Bar"]
    },
    departureDate: "08.05.2025",
    maxParticipants: 42
  }
};

const PackageTourDetailPage = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const tour = tourId ? packageToursData[tourId.toLowerCase()] : null;
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    participants: 1,
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  if (!tour) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Reise nicht gefunden</h1>
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
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Anfrage gesendet!",
      description: "Wir werden uns innerhalb von 24 Stunden bei Ihnen melden.",
    });
    
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      participants: 1,
      message: ""
    });
    setIsSubmitting(false);
  };

  const totalPrice = tour.price * formData.participants;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
          <img
            src={tour.image}
            alt={tour.destination}
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
                  {tour.duration}
                </Badge>
              </div>
              
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
                {tour.destination}
              </h1>
              <div className="flex items-center gap-2 text-white/90 text-lg">
                <MapPin className="w-5 h-5" />
                {tour.location}
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Quick Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="text-center p-4">
                  <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Dauer</p>
                  <p className="font-semibold">{tour.duration}</p>
                </Card>
                <Card className="text-center p-4">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Abreise</p>
                  <p className="font-semibold">{tour.departureDate}</p>
                </Card>
                <Card className="text-center p-4">
                  <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Max. Teilnehmer</p>
                  <p className="font-semibold">{tour.maxParticipants}</p>
                </Card>
                <Card className="text-center p-4">
                  <Hotel className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Hotel</p>
                  <div className="flex justify-center">
                    {[...Array(tour.hotelInfo.stars)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                </Card>
              </div>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-primary" />
                    Reisebeschreibung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {tour.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mt-6">
                    {tour.highlights.map((highlight) => (
                      <Badge key={highlight} variant="secondary">
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Gallery */}
              <Card>
                <CardHeader>
                  <CardTitle>Impressionen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <img
                      src={tour.gallery[selectedImage]}
                      alt={`${tour.destination} ${selectedImage + 1}`}
                      className="w-full h-64 md:h-80 object-cover rounded-lg"
                    />
                    <div className="grid grid-cols-4 gap-2">
                      {tour.gallery.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`relative rounded-lg overflow-hidden transition-all ${
                            selectedImage === index 
                              ? "ring-2 ring-primary" 
                              : "opacity-70 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`${tour.destination} ${index + 1}`}
                            className="w-full h-16 md:h-20 object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Itinerary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bus className="w-5 h-5 text-primary" />
                    Reiseverlauf
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {tour.itinerary.map((day, index) => (
                      <div key={day.day} className="relative pl-8">
                        {index !== tour.itinerary.length - 1 && (
                          <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-border" />
                        )}
                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                          {day.day}
                        </div>
                        <h4 className="font-semibold text-foreground">{day.title}</h4>
                        <p className="text-muted-foreground text-sm mt-1">{day.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Included / Not Included */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-600" />
                      Im Preis enthalten
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {tour.included.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Nicht enthalten</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {tour.notIncluded.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="w-4 h-4 shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Hotel Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hotel className="w-5 h-5 text-primary" />
                    Unterkunft
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <h4 className="font-semibold text-lg">{tour.hotelInfo.name}</h4>
                    <div className="flex">
                      {[...Array(tour.hotelInfo.stars)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tour.hotelInfo.features.map((feature) => (
                      <Badge key={feature} variant="outline">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Booking Form */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="border-2 border-primary/20">
                  <CardHeader className="bg-primary/5">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Jetzt anfragen</CardTitle>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">ab {tour.price}€</p>
                        <p className="text-xs text-muted-foreground">pro Person</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">Vorname</Label>
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Nachname</Label>
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">E-Mail</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            className="pl-10"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefon</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            type="tel"
                            className="pl-10"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="participants">Anzahl Personen</Label>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="participants"
                            type="number"
                            min={1}
                            max={10}
                            className="pl-10"
                            value={formData.participants}
                            onChange={(e) => setFormData({ ...formData, participants: parseInt(e.target.value) || 1 })}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="message">Nachricht (optional)</Label>
                        <Textarea
                          id="message"
                          placeholder="Besondere Wünsche oder Fragen..."
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          rows={3}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between items-center text-lg font-semibold">
                        <span>Geschätzter Preis:</span>
                        <span className="text-primary">{totalPrice}€</span>
                      </div>
                      
                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          "Wird gesendet..."
                        ) : (
                          <>
                            Unverbindlich anfragen
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                      
                      <p className="text-xs text-muted-foreground text-center">
                        Kostenlose und unverbindliche Anfrage. Wir melden uns innerhalb von 24 Stunden.
                      </p>
                    </form>
                  </CardContent>
                </Card>
                
                {/* Contact Card */}
                <Card className="mt-4">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-3">
                      Fragen? Rufen Sie uns an:
                    </p>
                    <a
                      href="tel:+436601234567"
                      className="flex items-center gap-2 text-primary font-semibold hover:underline"
                    >
                      <Phone className="w-4 h-4" />
                      +43 660 123 4567
                    </a>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PackageTourDetailPage;
