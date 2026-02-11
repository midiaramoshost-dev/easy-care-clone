import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Heart, Users, Clock, Star, ChevronLeft, ChevronRight, Monitor, Zap } from "lucide-react";
import heroCare from "@/assets/hero-care.jpg";
import familyHappiness from "@/assets/family-happiness.jpg";
import technologyCare from "@/assets/technology-care.jpg";

const slides = [
  {
    id: 1,
    icon: Heart,
    title: "Cuidado Humanizado",
    description: "Nossa plataforma conecta famílias a cuidadores qualificados, garantindo atenção personalizada e carinhosa para cada idoso.",
    image: heroCare,
    imageAlt: "Cuidador profissional auxiliando idosa",
    stats: [
      { label: "Famílias Atendidas", value: "10.000+" },
      { label: "Satisfação", value: "98%" },
    ],
  },
  {
    id: 2,
    icon: Monitor,
    title: "Monitoramento 24/7",
    description: "Acompanhe a saúde e bem-estar dos seus entes queridos em tempo real, com alertas inteligentes e relatórios detalhados.",
    image: familyHappiness,
    imageAlt: "Família feliz reunida com segurança",
    stats: [
      { label: "Monitoramento", value: "24/7" },
      { label: "Alertas em tempo real", value: "100%" },
    ],
  },
  {
    id: 3,
    icon: Zap,
    title: "Tecnologia Avançada",
    description: "Inteligência artificial e sensores de ponta para um cuidado preventivo, antecipando necessidades antes que se tornem problemas.",
    image: technologyCare,
    imageAlt: "Tecnologia avançada para cuidado de idosos",
    stats: [
      { label: "Avaliação Média", value: "4.9★" },
      { label: "Certificações", value: "LGPD + ISO" },
    ],
  },
];

const HeroSlideshow = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  const goTo = useCallback((index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  }, [current]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[current];

  return (
    <section className="py-16 lg:py-24 bg-card relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30" />

      <div className="container-custom mx-auto px-4 md:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary-light border border-trust-border text-sm font-medium text-primary mb-4">
            Conheça Nossa Plataforma
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Por que escolher o <span className="text-gradient">CuidadoFácil</span>?
          </h2>
        </motion.div>

        <div className="relative rounded-3xl overflow-hidden bg-background border border-border/50 shadow-xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={slide.id}
              custom={direction}
              variants={{
                enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
                center: { opacity: 1, x: 0 },
                exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="grid md:grid-cols-2 gap-0"
            >
              {/* Image */}
              <div className="relative h-64 md:h-[420px]">
                <img
                  src={slide.image}
                  alt={slide.imageAlt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/20 hidden md:block" />
              </div>

              {/* Content */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6">
                  <slide.icon className="w-7 h-7 text-primary-foreground" />
                </div>

                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  {slide.title}
                </h3>

                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                  {slide.description}
                </p>

                <div className="flex gap-6">
                  {slide.stats.map((stat, i) => (
                    <div key={i} className="text-center">
                      <p className="text-2xl font-bold text-gradient">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
            <button
              onClick={prev}
              className="w-9 h-9 rounded-full glass-effect border border-border/50 flex items-center justify-center hover:bg-primary/10 transition-colors"
              aria-label="Slide anterior"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>

            <div className="flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === current ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="w-9 h-9 rounded-full glass-effect border border-border/50 flex items-center justify-center hover:bg-primary/10 transition-colors"
              aria-label="Próximo slide"
            >
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSlideshow;
