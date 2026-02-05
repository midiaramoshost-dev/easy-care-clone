import Header from "@/components/Header";
import HeroCarousel from "@/components/HeroCarousel";
import StatsSection from "@/components/StatsSection";
import TrustBadges from "@/components/TrustBadges";
import FeaturesSection from "@/components/FeaturesSection";
import TechnologySection from "@/components/TechnologySection";
import TestimonialsSection from "@/components/TestimonialsSection";
import PricingSection from "@/components/PricingSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import FloatingCTA from "@/components/FloatingCTA";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroCarousel />
        <StatsSection />
        <TrustBadges />
        <FeaturesSection />
        <TechnologySection />
        <TestimonialsSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
      <FloatingCTA />
    </div>
  );
};

export default Index;
