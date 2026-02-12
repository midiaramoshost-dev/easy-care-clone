import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Camera } from "lucide-react";
import { usePlans } from "@/hooks/usePlans";
import { useState } from "react";

const PricingSection = () => {
  const { data: plans = [] } = usePlans();
  const [category, setCategory] = useState<"care" | "cameras">("care");

  const carePlans = plans.filter((p) => !p.name.toLowerCase().includes("monitor"));
  const cameraPlans = plans.filter((p) => p.name.toLowerCase().includes("monitor"));

  const activePlans = category === "care" ? carePlans : cameraPlans;

  const getDisplayPrice = (price: number, period: string | null) => {
    if (price === 0 && !period) return "Sob Consulta";
    if (price === 0) return "Grátis";
    return `R$ ${price}`;
  };

  return (
    <section className="section-padding bg-section-light relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-20" />

      <div className="container-custom mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary-light text-primary text-sm font-medium mb-4">
            Preços
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Planos que cabem no seu orçamento
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Escolha o plano ideal para sua família. Comece grátis e cancele quando quiser.
          </p>

          {/* Category Toggle */}
          <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-full">
            <button
              onClick={() => setCategory("care")}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                category === "care"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Planos de Cuidado
            </button>
            <button
              onClick={() => setCategory("cameras")}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                category === "cameras"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Camera className="h-4 w-4" />
              Monitoramento por Câmeras
            </button>
          </div>
        </motion.div>

        <div
          className={`grid gap-6 max-w-6xl mx-auto ${
            activePlans.length <= 3
              ? "md:grid-cols-3"
              : "md:grid-cols-2 lg:grid-cols-4"
          }`}
        >
          {activePlans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-7 rounded-2xl bg-card border-2 ${
                plan.popular
                  ? "border-primary shadow-2xl scale-105 z-10"
                  : "border-border/50 hover:border-primary/30"
              } transition-all duration-300`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold rounded-full shadow-lg whitespace-nowrap">
                  Mais Popular
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className={`font-bold text-foreground ${plan.price === 0 && !plan.period ? "text-2xl" : "text-3xl"}`}>
                    {getDisplayPrice(plan.price, plan.period)}
                  </span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        plan.popular ? "bg-gradient-to-br from-primary to-accent" : "bg-primary/10"
                      }`}
                    >
                      <Check className={`w-3 h-3 ${plan.popular ? "text-primary-foreground" : "text-primary"}`} />
                    </div>
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full h-11 rounded-xl font-semibold ${
                  plan.popular
                    ? "bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground shadow-lg"
                    : "bg-secondary hover:bg-secondary/80 text-foreground"
                }`}
              >
                {plan.cta_text}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
