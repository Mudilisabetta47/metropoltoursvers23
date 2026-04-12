import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSlider from "@/components/home/HeroSlider";
import FeaturesSection from "@/components/home/FeaturesSection";
import PackageToursSection from "@/components/home/PackageToursSection";
import WeekendTripsSection from "@/components/home/WeekendTripsSection";

import TestimonialsSection from "@/components/home/TestimonialsSection";
import NewsletterSection from "@/components/home/NewsletterSection";
import CTASection from "@/components/home/CTASection";
import NearestStopFinder from "@/components/home/NearestStopFinder";
import ScrollToTopButton from "@/components/home/ScrollToTopButton";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSlider />
        <FeaturesSection />
        <PackageToursSection />
        <WeekendTripsSection />
        
        <NearestStopFinder />
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
