import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Heart, Shield, ChevronLeft, ChevronRight, Monitor, Zap, Star } from "lucide-react";
import heroCare from "@/assets/hero-care.jpg";
import familyHappiness from "@/assets/family-happiness.jpg";
import technologyCare from "@/assets/technology-care.jpg";

const slides = [
  {
    id: 1,
    icon: Heart,
    badge: "Certificado LGPD • ISO 27001",
    title: "Cuidado que",
    highlight: "transforma",
    subtitle: "vidas",
    description: "Plataforma completa de monitoramento e cuidado para idosos. Tecnologia, carinho e segurança em um só lugar.",
    image: heroCare,
    imageAlt: "Cuidador profissional auxiliando idosa com carinho e atenção",
    cta: "Começar Gratuitamente",
    secondaryCta: "Ver Demonstração",
  },
  {
    id: 2,
    icon: Monitor,
    badge: "Monitoramento Inteligente",
    title: "Acompanhamento",
    highlight: "24 horas",
    subtitle: "por dia",
    description: "Monitore a saúde e bem-estar em tempo real com alertas inteligentes, relatórios detalhados e equipe pronta para agir.",
    image: familyHappiness,
    imageAlt: "Família feliz reunida com segurança e tranquilidade",
    cta: "Conhecer Planos",
    secondaryCta: "Saiba Mais",
  },
  {
    id: 3,
    icon: Zap,
    badge: "IA Avançada • Sensores IoT",
    title: "Tecnologia que",
    highlight: "cuida",
    subtitle: "de verdade",
    description: "Inteligência artificial e sensores de ponta para cuidado preventivo. Antecipamos necessidades antes que se tornem problemas.",
    image: technologyCare,
    imageAlt: "Tecnologia avançada para cuidado de idosos",
    cta: "Teste Grátis 7 Dias",
    secondaryCta: "Ver Tecnologia",
  },
];

const HeroSlideshow = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [progress, setProgress] = useState(0);

  const INTERVAL = 6000;

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % slides.length);
    setProgress(0);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
  }, []);

  const goTo = useCallback((index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
    setProgress(0);
  }, [current]);

  // Auto-advance
  useEffect(() => {
    const timer = setInterval(next, INTERVAL);
    return () => clearInterval(timer);
  }, [next]);

  // Progress bar animation
  useEffect(() => {
    const step = 50;
    const increment = (step / INTERVAL) * 100;
    const timer = setInterval(() => {
      setProgress((prev) => Math.min(prev + increment, 100));
    }, step);
    return () => clearInterval(timer);
  }, [current]);

  const slide = slides[current];

  return (
    <section className="relative min-h-screen pt-20 overflow-hidden">
      {/* Full-bleed background image with overlay */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id + "-bg"}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img
            src={slide.image}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/50 to-foreground/25" />
          {/* Accent gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
        </motion.div>
      </AnimatePresence>

      <div className="container-custom mx-auto px-4 md:px-8 relative z-10">
        <div className="flex flex-col justify-center min-h-[calc(100vh-5rem)] py-16">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={slide.id}
              custom={direction}
              variants={{
                enter: (dir: number) => ({ opacity: 0, y: dir > 0 ? 30 : -30 }),
                center: { opacity: 1, y: 0 },
                exit: (dir: number) => ({ opacity: 0, y: dir > 0 ? -30 : 30 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="max-w-3xl"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/8 backdrop-blur-sm border border-white/15 mb-8"
              >
                <slide.icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-white/90">{slide.badge}</span>
              </motion.div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.08] mb-6">
                <span className="text-white">{slide.title} </span>
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{slide.highlight}</span>
                <br />
                <span className="text-white">{slide.subtitle}</span>
              </h1>

              {/* Description */}
              <p className="text-lg md:text-xl text-white/75 mb-10 max-w-2xl leading-relaxed">
                {slide.description}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground gap-2 px-8 h-14 text-lg rounded-xl shadow-md transition-all"
                >
                  {slide.cta}
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 px-8 h-14 text-lg rounded-xl border-2 border-white/25 text-white bg-white/5 backdrop-blur-sm hover:bg-white/15 hover:border-white/40 transition-all"
                >
                  <Play className="w-5 h-5" />
                  {slide.secondaryCta}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Bottom bar: trust + navigation */}
          <div className="mt-auto pt-12 flex flex-col-reverse md:flex-row items-start md:items-center justify-between gap-6">
            {/* Trust row */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[Heart, Shield, Star].map((Icon, i) => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground border-2 border-white/20"
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-white">+10.000 famílias</p>
                  <p className="text-white/60">já confiam em nós</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex text-warning">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-white/60">4.9/5</span>
              </div>
            </div>

            {/* Slide navigation */}
            <div className="flex items-center gap-4">
              <button
                onClick={prev}
                className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center hover:bg-white/20 transition-all"
                aria-label="Slide anterior"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>

              {/* Progress indicators */}
              <div className="flex gap-2 items-center">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className="relative h-1.5 rounded-full overflow-hidden transition-all duration-300"
                    style={{ width: i === current ? 48 : 12 }}
                    aria-label={`Slide ${i + 1}`}
                  >
                    <div className="absolute inset-0 bg-white/20 rounded-full" />
                    {i === current && (
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    )}
                    {i < current && (
                      <div className="absolute inset-0 bg-white/50 rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={next}
                className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center hover:bg-white/20 transition-all"
                aria-label="Próximo slide"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSlideshow;
