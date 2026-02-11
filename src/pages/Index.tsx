import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import HeroSlideshow from "@/components/HeroSlideshow";
import NewStatsSection from "@/components/NewStatsSection";
import TrustBadges from "@/components/TrustBadges";
import NewFeaturesSection from "@/components/NewFeaturesSection";
import TechnologySection from "@/components/TechnologySection";
import NewTestimonialsSection from "@/components/NewTestimonialsSection";
import PricingSection from "@/components/PricingSection";
import NewCTASection from "@/components/NewCTASection";
import Footer from "@/components/Footer";
import FloatingCTA from "@/components/FloatingCTA";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <HeroSlideshow />
        <NewStatsSection />
        <TrustBadges />
        <NewFeaturesSection />
        <TechnologySection />
        <NewTestimonialsSection />
        <PricingSection />
        <NewCTASection />
      </main>
      <Footer />
      <FloatingCTA />
    </div>
  );
};

export default Index;
