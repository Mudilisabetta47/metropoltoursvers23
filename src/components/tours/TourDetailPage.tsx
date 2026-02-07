import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";

// Tour Detail Components
import TourHeroSection from "./TourHeroSection";
import TourStickySidebar from "./TourStickySidebar";
import TourTabNavigation from "./TourTabNavigation";
import TourRecommendations from "./TourRecommendations";
import TourDatesSection from "./TourDatesSection";
import TourInclusionsSection from "./TourInclusionsSection";
import TourRoutesSection from "./TourRoutesSection";
import TourInfoSection from "./TourInfoSection";
import TourLegalSection from "./TourLegalSection";

// Types
import { 
  TourTariff, 
  TourDate, 
  TourRoute, 
  TourInclusion, 
  TourLegal,
  TourLuggageAddon,
  ExtendedPackageTour 
} from "@/hooks/useTourBuilder";

// Image imports for fallbacks
import tourCroatia from "@/assets/tour-croatia.jpg";
import tourSlovenia from "@/assets/tour-slovenia.jpg";
import tourMontenegro from "@/assets/tour-montenegro.jpg";

const imageMap: Record<string, string> = {
  'kroatien': tourCroatia,
  'slowenien': tourSlovenia,
  'montenegro': tourMontenegro,
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
        // Fetch tour by slug or id
        const { data: tour, error: tourError } = await supabase
          .from('package_tours')
          .select('*')
          .or(`slug.eq.${tourId},id.eq.${tourId}`)
          .single();

        if (tourError || !tour) {
          console.error('Tour not found:', tourError);
          setTourData(null);
          return;
        }

        // Parallel fetches for related data
        const [tariffsRes, datesRes, routesRes, inclusionsRes, legalRes, luggageRes] = await Promise.all([
          supabase.from('tour_tariffs').select('*').eq('tour_id', tour.id).eq('is_active', true).order('sort_order'),
          supabase.from('tour_dates').select('*').eq('tour_id', tour.id).eq('is_active', true).order('departure_date'),
          supabase.from('tour_routes').select('*, tour_pickup_stops(*)').eq('tour_id', tour.id).eq('is_active', true).order('sort_order'),
          supabase.from('tour_inclusions').select('*').eq('tour_id', tour.id).order('sort_order'),
          supabase.from('tour_legal').select('*').eq('tour_id', tour.id).eq('is_active', true).order('sort_order'),
          supabase.from('tour_luggage_addons').select('*').eq('tour_id', tour.id).eq('is_active', true),
        ]);

        // Map routes with pickup_stops
        const routesWithStops = (routesRes.data || []).map((route: any) => ({
          ...route,
          pickup_stops: route.tour_pickup_stops || [],
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

        // Set defaults
        if (datesRes.data && datesRes.data.length > 0) {
          setSelectedDate(datesRes.data[0] as TourDate);
        }
        if (tariffsRes.data && tariffsRes.data.length > 0) {
          const recommended = tariffsRes.data.find((t: any) => t.is_recommended);
          setSelectedTariff((recommended || tariffsRes.data[0]) as TourTariff);
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
              <ChevronLeft className="w-4 h-4 mr-2" />
              Zurück zur Startseite
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
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      {/* pt-16 lg:pt-20 accounts for fixed header height */}
      <main className="flex-1 pt-16 lg:pt-20">
        {/* Hero Section */}
        <TourHeroSection 
          tour={tourData.tour}
          heroImage={getHeroImage()}
        />

        {/* Tab Navigation - Sticky */}
        <TourTabNavigation 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Content - 2/3 */}
            <div className="lg:col-span-2 space-y-8">
              {/* Recommendations Cards */}
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
                <TourRoutesSection 
                  routes={tourData.routes}
                  luggageAddons={tourData.luggageAddons}
                />
              )}

              {activeTab === "infos" && (
                <TourInfoSection 
                  tour={tourData.tour}
                />
              )}

              {activeTab === "agb" && (
                <TourLegalSection 
                  legalSections={tourData.legalSections}
                  tariffs={tourData.tariffs}
                />
              )}
            </div>

            {/* Right Sidebar - 1/3 */}
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
