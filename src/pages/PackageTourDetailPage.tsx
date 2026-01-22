import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  MapPin, Calendar, Clock, Users, Star, Check, 
  ChevronLeft, Phone, Mail, ArrowRight, X,
  Palmtree, Hotel, Bus, Camera, Ticket
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
import tourCroatia from "@/assets/tour-croatia.jpg";
import tourSlovenia from "@/assets/tour-slovenia.jpg";
import tourBosnia from "@/assets/tour-bosnia.jpg";
import tourMontenegro from "@/assets/tour-montenegro.jpg";
import tourSerbien from "@/assets/tour-serbien.jpg";
import tourNordmazedonien from "@/assets/tour-nordmazedonien.jpg";
import tourAlbanien from "@/assets/tour-albanien.jpg";
import tourKosovo from "@/assets/tour-kosovo.jpg";

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
    image: tourCroatia,
    gallery: [tourCroatia, tourCroatia, tourCroatia, tourCroatia],
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
  montenegro: {
    destination: "Montenegro",
    location: "Kotor & Budva",
    duration: "6 Tage",
    price: 279,
    image: tourMontenegro,
    gallery: [tourMontenegro, tourMontenegro, tourMontenegro, tourMontenegro],
    highlights: ["Bucht von Kotor", "Budva Altstadt", "Strände", "Berge"],
    description: "Entdecken Sie das Juwel der Adria auf dieser 6-tägigen Reise durch Montenegro. Die atemberaubende Bucht von Kotor, UNESCO-Weltkulturerbe, wird Sie verzaubern. Genießen Sie traumhafte Strände in Budva und erleben Sie die Gastfreundschaft dieses kleinen, aber beeindruckenden Landes.",
    included: [
      "Busfahrt im modernen Reisebus",
      "5 Übernachtungen im 4-Sterne-Hotel",
      "Halbpension (Frühstück & Abendessen)",
      "Stadtführung Kotor",
      "Ausflug nach Budva",
      "Bootsfahrt in der Bucht",
      "Deutschsprachige Reiseleitung"
    ],
    notIncluded: [
      "Reiseversicherung",
      "Persönliche Ausgaben",
      "Getränke zu den Mahlzeiten"
    ],
    itinerary: [
      { day: 1, title: "Anreise nach Budva", description: "Abfahrt am frühen Morgen. Fahrt entlang der Küste. Ankunft in Budva am Nachmittag." },
      { day: 2, title: "Budva Erkundung", description: "Stadtführung durch die Altstadt. Nachmittag am Strand." },
      { day: 3, title: "Kotor & Perast", description: "Ausflug zur Bucht von Kotor. Bootsfahrt zur Insel Gospa od Škrpjela." },
      { day: 4, title: "Cetinje & Lovćen", description: "Fahrt in die alte Königsstadt Cetinje. Panoramafahrt zum Lovćen-Nationalpark." },
      { day: 5, title: "Freier Tag", description: "Tag zur freien Verfügung am Strand oder optionaler Ausflug nach Dubrovnik." },
      { day: 6, title: "Heimreise", description: "Frühstück und gemütliche Rückfahrt." }
    ],
    hotelInfo: {
      name: "Hotel Bracera Budva",
      stars: 4,
      features: ["Strandnähe", "Pool", "WLAN", "Restaurant", "Klimaanlage"]
    },
    departureDate: "22.06.2025",
    maxParticipants: 42
  },
  slowenien: {
    destination: "Slowenien",
    location: "Bled & Ljubljana",
    duration: "5 Tage",
    price: 249,
    image: tourSlovenia,
    gallery: [tourSlovenia, tourSlovenia, tourSlovenia, tourSlovenia],
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
  albanien: {
    destination: "Albanien",
    location: "Albanische Riviera",
    duration: "8 Tage",
    price: 349,
    image: tourAlbanien,
    gallery: [tourAlbanien, tourAlbanien, tourAlbanien, tourAlbanien],
    highlights: ["Traumstrände", "Unberührte Natur", "Preiswert", "Gastfreundschaft"],
    description: "Entdecken Sie Europas letztes Geheimnis: die albanische Riviera. Traumhafte Strände, unberührte Natur und authentische Gastfreundschaft erwarten Sie. Von der Küstenstadt Saranda bis zum malerischen Ksamil erleben Sie 8 Tage pures Mittelmeerfeeling zu unschlagbaren Preisen.",
    included: [
      "Busfahrt im modernen Reisebus",
      "7 Übernachtungen im 4-Sterne-Hotel",
      "Halbpension (Frühstück & Abendessen)",
      "Stadtführung Saranda",
      "Ausflug nach Butrint (UNESCO)",
      "Bootsfahrt Ksamil-Inseln",
      "Deutschsprachige Reiseleitung"
    ],
    notIncluded: [
      "Reiseversicherung",
      "Persönliche Ausgaben",
      "Getränke zu den Mahlzeiten"
    ],
    itinerary: [
      { day: 1, title: "Anreise", description: "Abfahrt und Fahrt durch den Balkan. Zwischenstopp in Nordmazedonien." },
      { day: 2, title: "Weiterfahrt nach Saranda", description: "Fahrt entlang des Ohridsees nach Albanien. Ankunft in Saranda am Nachmittag." },
      { day: 3, title: "Ksamil & Strände", description: "Ausflug zu den berühmten Ksamil-Inseln. Schwimmen im kristallklaren Wasser." },
      { day: 4, title: "Butrint Nationalpark", description: "Besichtigung der UNESCO-Welterbestätte Butrint. Antike Ruinen am Meer." },
      { day: 5, title: "Blaues Auge", description: "Ausflug zur Karstquelle 'Blaues Auge'. Naturwunder inmitten von Wald." },
      { day: 6, title: "Freier Tag", description: "Tag zur freien Verfügung am Strand." },
      { day: 7, title: "Gjirokastër", description: "Ausflug zur Steinstadt Gjirokastër. UNESCO-Weltkulturerbe." },
      { day: 8, title: "Heimreise", description: "Frühstück und Rückfahrt mit Erinnerungen an unberührte Strände." }
    ],
    hotelInfo: {
      name: "Hotel Brilant Saranda",
      stars: 4,
      features: ["Meerblick", "Pool", "Strand", "WLAN", "Restaurant"]
    },
    departureDate: "01.07.2025",
    maxParticipants: 44
  },
  serbien: {
    destination: "Serbien",
    location: "Belgrad & Novi Sad",
    duration: "4 Tage",
    price: 189,
    image: tourSerbien,
    gallery: [tourSerbien, tourSerbien, tourSerbien, tourSerbien],
    highlights: ["Nachtleben", "Kalemegdan", "Donau", "Kulinarik"],
    description: "Erleben Sie die pulsierende Metropole Belgrad und das charmante Novi Sad auf dieser 4-tägigen Städtereise. Die Festung Kalemegdan, die lebendige Knez Mihailova Straße und das legendäre Nachtleben machen Serbien zu einem unvergesslichen Erlebnis.",
    included: [
      "Busfahrt im modernen Reisebus",
      "3 Übernachtungen im 4-Sterne-Hotel",
      "Frühstück",
      "Stadtführung Belgrad",
      "Ausflug nach Novi Sad",
      "Deutschsprachige Reiseleitung"
    ],
    notIncluded: [
      "Reiseversicherung",
      "Persönliche Ausgaben",
      "Mittag- und Abendessen"
    ],
    itinerary: [
      { day: 1, title: "Anreise nach Belgrad", description: "Anreise und Check-in im Hotel. Abends erste Erkundung der Stadt." },
      { day: 2, title: "Belgrad Stadtbesichtigung", description: "Geführte Tour durch Belgrad: Kalemegdan, Knez Mihailova, Skadarlija." },
      { day: 3, title: "Novi Sad Ausflug", description: "Tagesausflug nach Novi Sad. Petrovaradin-Festung und Altstadt." },
      { day: 4, title: "Heimreise", description: "Frühstück und gemütliche Rückfahrt." }
    ],
    hotelInfo: {
      name: "Hotel Moskva Belgrad",
      stars: 4,
      features: ["Zentrale Lage", "Restaurant", "WLAN", "Bar", "Historisches Gebäude"]
    },
    departureDate: "10.05.2025",
    maxParticipants: 45
  },
  bosnien: {
    destination: "Bosnien",
    location: "Sarajevo & Mostar",
    duration: "4 Tage",
    price: 199,
    image: tourBosnia,
    gallery: [tourBosnia, tourBosnia, tourBosnia, tourBosnia],
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
  },
  nordmazedonien: {
    destination: "Nordmazedonien",
    location: "Ohrid & Skopje",
    duration: "5 Tage",
    price: 229,
    image: tourNordmazedonien,
    gallery: [tourNordmazedonien, tourNordmazedonien, tourNordmazedonien, tourNordmazedonien],
    highlights: ["Ohridsee", "UNESCO-Kirchen", "Skopje Basar", "Kulinarik"],
    description: "Entdecken Sie die kulturellen Schätze Nordmazedoniens. Der Ohridsee, eines der ältesten Seen der Welt, beeindruckt mit türkisblauem Wasser und historischen Kirchen. In Skopje erleben Sie eine einzigartige Mischung aus Geschichte und modernem Kitsch.",
    included: [
      "Busfahrt im modernen Reisebus",
      "4 Übernachtungen im 3-Sterne-Hotel",
      "Halbpension (Frühstück & Abendessen)",
      "Stadtführung Ohrid",
      "Stadtführung Skopje",
      "Bootsfahrt auf dem Ohridsee",
      "Deutschsprachige Reiseleitung"
    ],
    notIncluded: [
      "Reiseversicherung",
      "Persönliche Ausgaben",
      "Getränke zu den Mahlzeiten"
    ],
    itinerary: [
      { day: 1, title: "Anreise nach Ohrid", description: "Anreise durch Serbien und Kosovo. Ankunft in Ohrid am Abend." },
      { day: 2, title: "Ohrid Erkundung", description: "Stadtführung durch die Altstadt. Besuch der Kirche Sv. Jovan Kaneo." },
      { day: 3, title: "Bootsfahrt & Kloster", description: "Bootsfahrt auf dem Ohridsee. Besuch des Klosters Sv. Naum." },
      { day: 4, title: "Skopje Ausflug", description: "Ganztagesausflug nach Skopje. Besichtigung der Altstadt und des Basars." },
      { day: 5, title: "Heimreise", description: "Frühstück und Rückfahrt." }
    ],
    hotelInfo: {
      name: "Hotel Metropol Ohrid",
      stars: 3,
      features: ["Seeblick", "Restaurant", "WLAN", "Garten"]
    },
    departureDate: "29.05.2025",
    maxParticipants: 40
  },
  kosovo: {
    destination: "Kosovo",
    location: "Prizren & Pristina",
    duration: "3 Tage",
    price: 159,
    image: tourKosovo,
    gallery: [tourKosovo, tourKosovo, tourKosovo, tourKosovo],
    highlights: ["Prizren Altstadt", "Moscheen", "Gastfreundschaft", "Geschichte"],
    description: "Entdecken Sie das jüngste Land Europas auf dieser 3-tägigen Kurzreise. Prizren, die heimliche Kulturhauptstadt, verzaubert mit osmanischer Architektur. Pristina überrascht mit Lebendigkeit und Aufbruchsstimmung.",
    included: [
      "Busfahrt im modernen Reisebus",
      "2 Übernachtungen im 3-Sterne-Hotel",
      "Frühstück",
      "Stadtführung Prizren",
      "Ausflug nach Pristina",
      "Deutschsprachige Reiseleitung"
    ],
    notIncluded: [
      "Reiseversicherung",
      "Persönliche Ausgaben",
      "Mittag- und Abendessen"
    ],
    itinerary: [
      { day: 1, title: "Anreise nach Prizren", description: "Anreise und Check-in. Abends Bummel durch die Altstadt." },
      { day: 2, title: "Prizren & Pristina", description: "Vormittags Stadtführung Prizren. Nachmittags Ausflug nach Pristina." },
      { day: 3, title: "Heimreise", description: "Frühstück und Rückfahrt." }
    ],
    hotelInfo: {
      name: "Hotel Theranda Prizren",
      stars: 3,
      features: ["Zentrale Lage", "Restaurant", "WLAN", "Terrasse"]
    },
    departureDate: "03.05.2025",
    maxParticipants: 44
  }
};

const PackageTourDetailPage = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
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
  const [inquiryNumber, setInquiryNumber] = useState<string | null>(null);

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
    
    try {
      // Generate inquiry number
      const { data: generatedNumber, error: numberError } = await supabase
        .rpc('generate_inquiry_number' as never);

      if (numberError) throw numberError;

      // Save inquiry to database
      const { error: insertError } = await supabase
        .from('package_tour_inquiries' as never)
        .insert({
          inquiry_number: generatedNumber,
          tour_id: tourId?.toLowerCase() || '',
          destination: tour.destination,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone || null,
          participants: formData.participants,
          message: formData.message || null,
          total_price: tour.price * formData.participants,
          departure_date: tour.departureDate,
          user_id: user?.id || null,
          status: 'pending'
        } as never);

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
                    <CardTitle className="text-lg flex items-center gap-2">
                      <X className="w-5 h-5 text-destructive" />
                      Nicht enthalten
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {tour.notIncluded.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm">
                          <X className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
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
                {inquiryNumber ? (
                  <Card className="border-primary">
                    <CardHeader className="bg-primary/5">
                      <CardTitle className="flex items-center gap-2 text-primary">
                        <Ticket className="w-5 h-5" />
                        Anfrage erfolgreich!
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Ihre Anfragenummer</p>
                          <p className="text-2xl font-bold text-primary">{inquiryNumber}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Wir haben Ihre Anfrage erhalten und werden uns innerhalb von 24 Stunden bei Ihnen melden.
                        </p>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setInquiryNumber(null)}
                        >
                          Neue Anfrage stellen
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Reise anfragen</CardTitle>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-primary">{tour.price}€</span>
                        <span className="text-muted-foreground">pro Person</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="firstName">Vorname *</Label>
                            <Input
                              id="firstName"
                              value={formData.firstName}
                              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="lastName">Nachname *</Label>
                            <Input
                              id="lastName"
                              value={formData.lastName}
                              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="email">E-Mail *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="phone">Telefon</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>

                        <div>
                          <Label htmlFor="participants">Anzahl Teilnehmer *</Label>
                          <Input
                            id="participants"
                            type="number"
                            min="1"
                            max={tour.maxParticipants}
                            value={formData.participants}
                            onChange={(e) => setFormData({ ...formData, participants: parseInt(e.target.value) || 1 })}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="message">Nachricht (optional)</Label>
                          <Textarea
                            id="message"
                            placeholder="Ihre Fragen oder Wünsche..."
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            rows={3}
                          />
                        </div>

                        <Separator />

                        <div className="flex justify-between items-center py-2">
                          <span className="text-muted-foreground">Gesamtpreis:</span>
                          <span className="text-2xl font-bold text-primary">{totalPrice}€</span>
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full" 
                          size="lg"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>Wird gesendet...</>
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
                    </CardContent>
                  </Card>
                )}

                {/* Contact Info */}
                <Card className="mt-6">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-4">Fragen zur Reise?</h4>
                    <div className="space-y-3">
                      <a 
                        href="tel:+4912345678"
                        className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        +49 123 456 78
                      </a>
                      <a 
                        href="mailto:info@metropol-tours.de"
                        className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        info@metropol-tours.de
                      </a>
                    </div>
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
