import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ChevronLeft, ChevronRight, Monitor, Zap } from "lucide-react";
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
    <section className="section-padding relative overflow-hidden">
      {/* Same gradient mesh used across all sections */}
      <div className="absolute inset-0 gradient-mesh opacity-40" />
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-accent/5 to-primary/5 rounded-full blur-3xl" />

      <div className="container-custom mx-auto relative z-10">
        {/* Section header — same pattern as other sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-light border border-trust-border text-sm font-medium text-primary mb-6">
            Conheça Nossa Plataforma
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Por que escolher o <span className="text-gradient">CuidadoFácil</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubra como nossa plataforma transforma o cuidado com quem você ama.
          </p>
        </motion.div>

        {/* Slide card — glass effect + rounded like other cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden bg-background/50 backdrop-blur-sm border border-border/50 card-shadow hover:card-shadow-hover transition-shadow duration-500"
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={slide.id}
              custom={direction}
              variants={{
                enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
                center: { opacity: 1, x: 0 },
                exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="grid md:grid-cols-2"
            >
              {/* Image with gradient overlay */}
              <div className="relative h-72 md:h-[440px] overflow-hidden">
                <img
                  src={slide.image}
                  alt={slide.imageAlt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/10 hidden md:block" />
                
                {/* Slide counter on image */}
                <div className="absolute top-4 left-4 glass-effect rounded-full px-3 py-1 text-xs font-medium text-foreground border border-border/50">
                  {current + 1} / {slides.length}
                </div>
              </div>

              {/* Content side */}
              <div className="p-8 md:p-12 lg:p-14 flex flex-col justify-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <slide.icon className="w-7 h-7 text-primary-foreground" />
                </div>

                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4 leading-tight">
                  {slide.title}
                </h3>

                <p className="text-muted-foreground text-base md:text-lg mb-8 leading-relaxed">
                  {slide.description}
                </p>

                {/* Stats — styled like NewStatsSection cards */}
                <div className="flex gap-6">
                  {slide.stats.map((stat, i) => (
                    <div
                      key={i}
                      className="px-5 py-4 rounded-2xl bg-background/50 border border-border/50 text-center flex-1"
                    >
                      <p className="text-xl md:text-2xl font-bold text-gradient mb-1">{stat.value}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation arrows — positioned on sides */}
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass-effect border border-border/50 flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-all z-10"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>

          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass-effect border border-border/50 flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-all z-10"
            aria-label="Próximo slide"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </motion.div>

        {/* Progress dots — below the card */}
        <div className="flex justify-center gap-2 mt-8">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-10 bg-gradient-to-r from-primary to-accent"
                  : "w-2.5 bg-muted-foreground/20 hover:bg-muted-foreground/40"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSlideshow;
