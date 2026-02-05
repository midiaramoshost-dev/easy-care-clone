import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowRight, Play, Shield } from "lucide-react";
import heroCare from "@/assets/hero-care.jpg";
import technologyCare from "@/assets/technology-care.jpg";
import familyHappiness from "@/assets/family-happiness.jpg";

const slides = [
  {
    badge: "Certificado LGPD • ISO 27001 • 100% Seguro",
    title: "Seus entes queridos merecem",
    highlight: "o melhor cuidado",
    description: "Plataforma completa de monitoramento e cuidado para idosos.",
    subDescription: "Tecnologia, carinho e segurança",
    subHighlight: "em um só lugar.",
    image: heroCare,
    imageAlt: "Cuidador profissional auxiliando idosa com carinho e atenção",
    primaryButton: "Começar Gratuitamente",
    secondaryButton: "Ver Demonstração",
  },
  {
    badge: "Cuidado Humanizado e Tecnológico",
    title: "Tecnologia que",
    highlight: "aproxima famílias",
    description: "Monitore a saúde e bem-estar do seu familiar em tempo real.",
    subDescription: "Relatórios inteligentes e alertas personalizados",
    subHighlight: "",
    image: technologyCare,
    imageAlt: "Interface tecnológica do aplicativo CuidadoFácil",
    primaryButton: "Conhecer Recursos",
    secondaryButton: "",
  },
  {
    badge: "Mais de 10.000 Famílias Conectadas",
    title: "Sua família unida no",
    highlight: "cuidado",
    description: "Compartilhe informações com toda a equipe de cuidadores.",
    subDescription: "Comunicação eficiente e organizada",
    subHighlight: "",
    image: familyHappiness,
    imageAlt: "Família brasileira feliz reunida com idosos",
    primaryButton: "Começar Agora",
    secondaryButton: "",
  },
];

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const slide = slides[currentSlide];

  return (
    <section className="relative pt-24 pb-16 md:pb-24 bg-background overflow-hidden">
      <div className="container-custom mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[600px]">
          {/* Left Content */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-light border border-trust-border mb-6">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">{slide.badge}</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="text-foreground">{slide.title}</span>
              <br />
              <span className="text-primary">{slide.highlight}</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-2">{slide.description}</p>
            <p className="text-lg mb-8">
              <span className="font-semibold text-foreground">{slide.subDescription}</span>
              {slide.subHighlight && (
                <span className="text-muted-foreground"> {slide.subHighlight}</span>
              )}
            </p>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary-dark text-primary-foreground gap-2 px-6">
                {slide.primaryButton}
                <ArrowRight className="w-4 h-4" />
              </Button>
              {slide.secondaryButton && (
                <Button size="lg" variant="outline" className="gap-2 px-6">
                  <Play className="w-4 h-4" />
                  {slide.secondaryButton}
                </Button>
              )}
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={slide.image}
                alt={slide.imageAlt}
                className="w-full h-[400px] md:h-[500px] object-cover transition-all duration-500"
              />
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide ? "w-8 bg-primary" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;
