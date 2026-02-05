import { Check } from "lucide-react";
import technologyCare from "@/assets/technology-care.jpg";

const features = [
  "IA para detecção de padrões de saúde",
  "Alertas preditivos de emergências",
  "Análise comportamental avançada",
  "Relatórios médicos automatizados",
];

const TechnologySection = () => {
  return (
    <section className="section-padding bg-section-light">
      <div className="container-custom mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Tecnologia que cuida
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Inteligência artificial e análise de dados para garantir o melhor cuidado possível,
              com alertas preventivos e insights personalizados em tempo real.
            </p>
            <ul className="space-y-4">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-foreground font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={technologyCare}
                alt="Dashboard do aplicativo CuidadoFácil"
                className="w-full h-[400px] object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechnologySection;
