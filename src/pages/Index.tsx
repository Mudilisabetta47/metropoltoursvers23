import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { InfoBanner } from "@/components/home/InfoBanner";
import HeroSlider from "@/components/home/HeroSlider";
import BusStorySection from "@/components/home/BusStorySection";
import BusDiscoverSection from "@/components/home/BusDiscoverSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import BrandShowcaseSection from "@/components/home/BrandShowcaseSection";

import WeekendTripsSection from "@/components/home/WeekendTripsSection";

import TestimonialsSection from "@/components/home/TestimonialsSection";
import TikTokSection from "@/components/home/TikTokSection";
import NewsletterSection from "@/components/home/NewsletterSection";
import CTASection from "@/components/home/CTASection";
import NearestStopFinder from "@/components/home/NearestStopFinder";
import ScrollToTopButton from "@/components/home/ScrollToTopButton";
import SEO from "@/components/seo/SEO";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Busreisen & Busvermietung ab Bremen, Hamburg & Hannover"
        description="Metropol Tours ist Ihr Busunternehmen für Busreisen, Gruppenreisen und Reisebus mieten – Abfahrten ab Bremen, Hamburg, Hannover und Berlin. Jetzt Angebot anfragen."
        path="/"
        jsonLd={[organizationJsonLd, websiteJsonLd]}
      />
      <Header />
      <main className="flex-1">
        <InfoBanner />
        <HeroSlider />
        <BusStorySection />
        <BusDiscoverSection />
        <FeaturesSection />
        <BrandShowcaseSection />
        {/* Pauschalreisen vorübergehend deaktiviert – Fokus auf Gruppenanfragen */}
        <WeekendTripsSection />
        
        <NearestStopFinder />
        <TikTokSection />
        <TestimonialsSection />
        <NewsletterSection />
        <CTASection />
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
};

export default Index;
