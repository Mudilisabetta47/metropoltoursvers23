import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";

import TourHeroSection from "./TourHeroSection";
import TourStickySidebar from "./TourStickySidebar";
import TourTabNavigation from "./TourTabNavigation";
import TourRecommendations from "./TourRecommendations";
import TourSocialProof from "./TourSocialProof";
import TourDatesSection from "./TourDatesSection";
import TourInclusionsSection from "./TourInclusionsSection";
import TourRoutesSection from "./TourRoutesSection";
import TourInfoSection from "./TourInfoSection";
import TourLegalSection from "./TourLegalSection";

import {
  TourTariff, TourDate, TourRoute, TourInclusion, TourLegal, TourLuggageAddon, ExtendedPackageTour
} from "@/hooks/useTourBuilder";

import tourCroatia from "@/assets/tour-croatia.jpg";
import tourSlovenia from "@/assets/tour-slovenia.jpg";
import tourMontenegro from "@/assets/tour-montenegro.jpg";

const imageMap: Record<string, string> = {
  'kroatien': tourCroatia, 'slowenien': tourSlovenia, 'montenegro': tourMontenegro,
};

export interface TourDetailData {
  tour: ExtendedPackageTour;
  tariffs: TourTariff[];
  dates: TourDate[];
  routes: TourRoute[];
  inclusions: TourInclusion[];
  legalSections: TourLegal[];
  luggageAddons: TourLuggageAddon[];
}

const FAQ_ITEMS = [
  { q: "Wie funktioniert die Sitzplatzwahl?", a: "Nach Ihrer Buchung können Sie je nach Tarif einen Wunschsitzplatz auswählen. Im Business-Tarif ist die Sitzplatzreservierung inklusive." },
  { q: "Wie bekomme ich meine Tickets?", a: "Nach erfolgreicher Zahlung erhalten Sie Buchungsbestätigung, Rechnung und Reise-Voucher per E-Mail. Alle Dokumente sind auch in 'Meine Reisen' abrufbar." },
  { q: "Kann ich kostenlos stornieren?", a: "Je nach Tarif ist eine kostenfreie Stornierung bis 14 Tage vor Abfahrt möglich. Details finden Sie in der Tarifauswahl." },
  { q: "Ist eine Reiseversicherung enthalten?", a: "Eine Reiseversicherung ist optional buchbar und kann bei der Buchung als Zusatzleistung hinzugefügt werden." },
];

const TourDetailPage = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [tourData, setTourData] = useState<TourDetailData | null>(null);
  const [activeTab, setActiveTab] = useState("leistungen");
  const [selectedDate, setSelectedDate] = useState<TourDate | null>(null);
  const [selectedTariff, setSelectedTariff] = useState<TourTariff | null>(null);
  const [participants, setParticipants] = useState(2);

  useEffect(() => {
    const fetchTourData = async () => {
      if (!tourId) return;
      setIsLoading(true);
      try {
        let tour = null;
        const { data: slugMatch } = await supabase
          .from('package_tours').select('*').eq('slug', tourId).maybeSingle();

        if (slugMatch) {
          tour = slugMatch;
        } else {
          const { data: idMatch } = await supabase
            .from('package_tours').select('*').eq('id', tourId).maybeSingle();
          tour = idMatch;
        }

        if (!tour) { setTourData(null); return; }

        const [tariffsRes, datesRes, routesRes, inclusionsRes, legalRes, luggageRes] = await Promise.all([
          supabase.from('tour_tariffs').select('*').eq('tour_id', tour.id).eq('is_active', true).order('sort_order'),
          supabase.from('tour_dates').select('*').eq('tour_id', tour.id).eq('is_active', true).order('departure_date'),
          supabase.from('tour_routes').select('*, tour_pickup_stops(*)').eq('tour_id', tour.id).eq('is_active', true).order('sort_order'),
          supabase.from('tour_inclusions').select('*').eq('tour_id', tour.id).order('sort_order'),
          supabase.from('tour_legal').select('*').eq('tour_id', tour.id).eq('is_active', true).order('sort_order'),
          supabase.from('tour_luggage_addons').select('*').eq('tour_id', tour.id).eq('is_active', true),
        ]);

        const routesWithStops = (routesRes.data || []).map((route: any) => ({
          ...route, pickup_stops: route.tour_pickup_stops || [],
        }));

        setTourData({
          tour: tour as unknown as ExtendedPackageTour,
          tariffs: (tariffsRes.data || []) as TourTariff[],
          dates: (datesRes.data || []) as TourDate[],
          routes: routesWithStops as TourRoute[],
          inclusions: (inclusionsRes.data || []) as TourInclusion[],
          legalSections: (legalRes.data || []) as TourLegal[],
          luggageAddons: (luggageRes.data || []) as TourLuggageAddon[],
        });

        if (datesRes.data?.[0]) setSelectedDate(datesRes.data[0] as TourDate);
        if (tariffsRes.data?.length) {
          const rec = tariffsRes.data.find((t: any) => t.is_recommended);
          setSelectedTariff((rec || tariffsRes.data[0]) as TourTariff);
        }
      } catch (error) {
        console.error('Error fetching tour:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTourData();
  }, [tourId]);

  const getHeroImage = () => {
    if (tourData?.tour.hero_image_url) return tourData.tour.hero_image_url;
    if (tourData?.tour.image_url) return tourData.tour.image_url;
    const key = tourData?.tour.destination.toLowerCase();
    return key ? imageMap[key] || tourCroatia : tourCroatia;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!tourData) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-2xl font-bold mb-4">Reise nicht gefunden</h1>
            <p className="text-muted-foreground mb-6">Diese Reise ist leider nicht verfügbar.</p>
            <Button onClick={() => navigate("/")} variant="outline">
              <ChevronLeft className="w-4 h-4 mr-2" /> Zurück zur Startseite
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const lowestPrice = tourData.dates.length > 0
    ? Math.min(...tourData.dates.map(d => d.price_basic))
    : tourData.tour.price_from;

  const availableSeats = selectedDate
    ? selectedDate.total_seats - selectedDate.booked_seats
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      <main className="flex-1 pt-16 lg:pt-20">
        {/* Hero: Gallery + Title + Reviews */}
        <TourHeroSection
          tour={tourData.tour}
          heroImage={getHeroImage()}
          lowestPrice={lowestPrice}
        />

        {/* Tab Navigation */}
        <TourTabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content */}
        <div className="max-w-[1240px] mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left 2/3 */}
            <div className="lg:col-span-2 space-y-8">
              {/* Social Proof */}
              <TourSocialProof
                tourId={tourData.tour.id}
                availableSeats={availableSeats}
                selectedDateId={selectedDate?.id}
              />

              {/* Quick Picks */}
              <TourRecommendations
                dates={tourData.dates}
                tariffs={tourData.tariffs}
                onSelectDate={setSelectedDate}
              />

              {/* Tab Content */}
              {activeTab === "leistungen" && (
                <TourInclusionsSection
                  inclusions={tourData.inclusions}
                  tariffs={tourData.tariffs}
                  selectedTariff={selectedTariff}
                  onSelectTariff={setSelectedTariff}
                />
              )}
              {activeTab === "termine" && (
                <TourDatesSection
                  dates={tourData.dates}
                  tariffs={tourData.tariffs}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
              )}
              {activeTab === "route" && (
                <TourRoutesSection routes={tourData.routes} luggageAddons={tourData.luggageAddons} />
              )}
              {activeTab === "infos" && (
                <TourInfoSection tour={tourData.tour} />
              )}
              {activeTab === "agb" && (
                <TourLegalSection legalSections={tourData.legalSections} tariffs={tourData.tariffs} />
              )}

              {/* FAQ */}
              <section className="scroll-mt-36">
                <h2 className="text-xl font-bold text-foreground mb-4">Häufige Fragen</h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {FAQ_ITEMS.map((item, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="bg-card border border-border rounded-lg px-4">
                      <AccordionTrigger className="text-left text-foreground hover:no-underline">{item.q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1">
              <TourStickySidebar
                tour={tourData.tour}
                selectedDate={selectedDate}
                selectedTariff={selectedTariff}
                tariffs={tourData.tariffs}
                participants={participants}
                availableSeats={availableSeats}
                lowestPrice={lowestPrice}
                onParticipantsChange={setParticipants}
                onSelectTariff={setSelectedTariff}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TourDetailPage;
