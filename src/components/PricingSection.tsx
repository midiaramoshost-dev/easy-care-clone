import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Básico",
    price: "Grátis",
    description: "Para começar a organizar o cuidado",
    features: [
      "1 idoso monitorado",
      "Agenda básica",
      "Relatórios simples",
      "Suporte por email",
    ],
    popular: false,
    cta: "Começar Grátis",
  },
  {
    name: "Família",
    price: "R$ 49",
    period: "/mês",
    description: "Para famílias que precisam de mais recursos",
    features: [
      "Até 3 idosos",
      "Agenda completa",
      "Relatórios detalhados",
      "Alertas personalizados",
      "Suporte prioritário",
    ],
    popular: true,
    cta: "Escolher Plano",
  },
  {
    name: "Profissional",
    price: "R$ 99",
    period: "/mês",
    description: "Para cuidadores e profissionais de saúde",
    features: [
      "Idosos ilimitados",
      "Todas as funcionalidades",
      "API e integrações",
      "Relatórios avançados",
      "Suporte 24/7",
      "Treinamento incluso",
    ],
    popular: false,
    cta: "Escolher Plano",
  },
];

const PricingSection = () => {
  return (
    <section className="section-padding bg-section-light relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-20" />
      
      <div className="container-custom mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary-light text-primary text-sm font-medium mb-4">
            Preços
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Planos que cabem no seu orçamento
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano ideal para sua família. Comece grátis e cancele quando quiser.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-8 rounded-2xl bg-card border-2 ${
                plan.popular 
                  ? "border-primary shadow-2xl scale-105 z-10" 
                  : "border-border/50 hover:border-primary/30"
              } transition-all duration-300`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold rounded-full shadow-lg">
                  Mais Popular
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-3">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${plan.popular ? 'bg-gradient-to-br from-primary to-accent' : 'bg-primary/10'}`}>
                      <Check className={`w-4 h-4 ${plan.popular ? 'text-primary-foreground' : 'text-primary'}`} />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full h-12 rounded-xl font-semibold ${
                  plan.popular
                    ? "bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground shadow-lg"
                    : "bg-secondary hover:bg-secondary/80 text-foreground"
                }`}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
