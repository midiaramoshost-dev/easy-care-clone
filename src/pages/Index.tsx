import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import HeroSlideshow from "@/components/HeroSlideshow";
import NewStatsSection from "@/components/NewStatsSection";
import TrustBadges from "@/components/TrustBadges";
import NewFeaturesSection from "@/components/NewFeaturesSection";
import TechnologySection from "@/components/TechnologySection";
import NewTestimonialsSection from "@/components/NewTestimonialsSection";
import PricingSection from "@/components/PricingSection";
import NewCTASection from "@/components/NewCTASection";
import DonationSection from "@/components/DonationSection";
import Footer from "@/components/Footer";
import FloatingCTA from "@/components/FloatingCTA";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Cuidadores de Idosos em Sorocaba/SP | CuidadoFácil</title>
        <meta name="description" content="Cuidadores de idosos, home care e casas de repouso em Sorocaba e região (SP). Plataforma com tecnologia, segurança e carinho para sua família." />
        <link rel="canonical" href="https://easy-care-clone.lovable.app/" />
        <meta property="og:title" content="Cuidadores de Idosos em Sorocaba/SP | CuidadoFácil" />
        <meta property="og:url" content="https://easy-care-clone.lovable.app/" />
        <meta property="og:description" content="Cuidadores, home care e casas de repouso em Sorocaba e região. Tecnologia, segurança e carinho." />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            { "@type": "Question", "name": "Vocês atendem em Sorocaba?", "acceptedAnswer": { "@type": "Answer", "text": "Sim. Sorocaba é nossa cidade-sede, e atendemos toda a região: Votorantim, Itu, Salto, Itapetininga, São Roque, Mairinque, Boituva, Tatuí e Piedade." } },
            { "@type": "Question", "name": "Quanto custa um cuidador de idosos em Sorocaba?", "acceptedAnswer": { "@type": "Answer", "text": "Os planos variam conforme a carga horária e o tipo de cuidado. Consulte os planos na página inicial para valores em Sorocaba e região." } },
            { "@type": "Question", "name": "Como contratar home care em Sorocaba?", "acceptedAnswer": { "@type": "Answer", "text": "Cadastre-se na plataforma, escolha o cuidador e o plano adequado. Toda a contratação é digital, segura e com acompanhamento da família." } }
          ]
        })}</script>
      </Helmet>
      <Header />
      <main>
        <HeroSlideshow />
        <NewStatsSection />
        <TrustBadges />
        <NewFeaturesSection />
        <TechnologySection />
        <NewTestimonialsSection />
        <PricingSection />
        <DonationSection />
        <NewCTASection />
      </main>
      <Footer />
      <FloatingCTA />
    </div>
  );
};

export default Index;
