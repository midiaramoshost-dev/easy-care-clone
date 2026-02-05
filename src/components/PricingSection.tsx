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
    <section className="section-padding bg-section-light">
      <div className="container-custom mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Planos que cabem no seu orçamento
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano ideal para sua família. Comece grátis e cancele quando quiser.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-6 rounded-xl bg-white border ${
                plan.popular ? "border-primary shadow-xl scale-105" : "border-border"
              } transition-all duration-300`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-sm font-medium rounded-full">
                  Mais Popular
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${
                  plan.popular
                    ? "bg-primary hover:bg-primary-dark text-white"
                    : "bg-secondary hover:bg-secondary/80 text-foreground"
                }`}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
