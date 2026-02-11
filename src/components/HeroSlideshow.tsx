import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Shield, Heart, Users, Clock, Star, ChevronLeft, ChevronRight } from "lucide-react";
import heroCare from "@/assets/hero-care.jpg";
import familyHappiness from "@/assets/family-happiness.jpg";
import technologyCare from "@/assets/technology-care.jpg";

const slides = [
  {
    id: 1,
    badge: "Certificado LGPD • ISO 27001 • 100% Seguro",
    badgeIcon: Shield,
    title: "Cuidado que",
    highlight: "transforma",
    subtitle: "vidas",
    description: "Plataforma completa de monitoramento e cuidado para idosos.",
    subdescription: "Tecnologia, carinho e segurança em um só lugar.",
    image: heroCare,
    imageAlt: "Cuidador profissional auxiliando idosa com carinho e atenção",
    cta: "Começar Gratuitamente",
    secondaryCta: "Ver Demonstração",
  },
  {
    id: 2,
    badge: "+10.000 famílias confiam em nós",
    badgeIcon: Heart,
    title: "Monitoramento",
    highlight: "24 horas",
    subtitle: "por dia",
    description: "Acompanhe a saúde e bem-estar dos seus entes queridos em tempo real.",
    subdescription: "Alertas inteligentes e relatórios detalhados.",
    image: familyHappiness,
    imageAlt: "Família feliz reunida com segurança e tranquilidade",
    cta: "Conhecer Planos",
    secondaryCta: "Saiba Mais",
  },
  {
    id: 3,
    badge: "Tecnologia de ponta • IA Avançada",
    badgeIcon: Star,
    title: "Tecnologia que",
    highlight: "cuida",
    subtitle: "de verdade",
    description: "Inteligência artificial e sensores avançados para um cuidado preventivo.",
    subdescription: "98% de satisfação entre nossos usuários.",
    image: technologyCare,
    imageAlt: "Tecnologia avançada para cuidado de idosos",
    cta: "Teste Grátis por 7 Dias",
    secondaryCta: "Ver Tecnologia",
  },
];

const HeroSlideshow = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = useCallback((index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  }, [current]);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[current];

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 80 : -80 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -80 : 80 }),
  };

  return (
    <section className="relative min-h-screen pt-20 overflow-hidden gradient-mesh">
      <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-accent/10 to-primary/10 rounded-full blur-3xl" />

      <div className="container-custom mx-auto px-4 md:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center min-h-[calc(100vh-5rem)] py-12">
          {/* Left Content */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={slide.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-light border border-trust-border mb-8">
                <slide.badgeIcon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">{slide.badge}</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] mb-6">
                <span className="text-foreground">{slide.title} </span>
                <span className="text-gradient">{slide.highlight}</span>
                <br />
                <span className="text-foreground">{slide.subtitle}</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-xl">
                {slide.description}
              </p>
              <p className="text-lg md:text-xl mb-10 max-w-xl">
                <span className="font-semibold text-foreground">{slide.subdescription}</span>
              </p>

              <div className="flex flex-wrap gap-4 mb-12">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground gap-2 px-8 h-14 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  {slide.cta}
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 px-8 h-14 text-lg rounded-xl border-2 hover:bg-primary-light"
                >
                  <Play className="w-5 h-5" />
                  {slide.secondaryCta}
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[Heart, Users, Shield].map((Icon, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-sm font-medium border-2 border-background"
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                    ))}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-sm font-medium border-2 border-background">
                      +
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-foreground">+10.000 famílias</p>
                    <p className="text-muted-foreground">já confiam em nós</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex text-warning">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">4.9/5 (2.000+ avaliações)</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Right Image */}
          <div className="relative">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={slide.id + "-img"}
                custom={direction}
                variants={{
                  enter: (dir: number) => ({ opacity: 0, scale: 0.95 }),
                  center: { opacity: 1, scale: 1 },
                  exit: { opacity: 0, scale: 0.95 },
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative"
              >
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src={slide.image}
                    alt={slide.imageAlt}
                    className="w-full h-[500px] lg:h-[600px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent" />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Floating cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute -left-6 top-1/4 glass-effect rounded-2xl p-4 shadow-xl border border-border/50 z-10"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Heart className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Saúde monitorada</p>
                  <p className="text-sm text-muted-foreground">24 horas por dia</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="absolute -right-6 bottom-1/4 glass-effect rounded-2xl p-4 shadow-xl border border-border/50 z-10"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">100% Seguro</p>
                  <p className="text-sm text-muted-foreground">Dados protegidos</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Slide controls */}
        <div className="flex items-center justify-center gap-4 pb-8 -mt-4">
          <button
            onClick={prev}
            className="w-10 h-10 rounded-full glass-effect border border-border/50 flex items-center justify-center hover:bg-primary/10 transition-colors"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>

          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"
                }`}
                aria-label={`Ir para slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-10 h-10 rounded-full glass-effect border border-border/50 flex items-center justify-center hover:bg-primary/10 transition-colors"
            aria-label="Próximo slide"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSlideshow;
