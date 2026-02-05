import { Shield, Heart, Users, BarChart3, Clock, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Segurança Total",
    description: "Dados protegidos com criptografia de nível bancário e conformidade LGPD",
  },
  {
    icon: Heart,
    title: "Cuidado Humanizado",
    description: "Tecnologia que fortalece o vínculo familiar e melhora a qualidade de vida",
  },
  {
    icon: Users,
    title: "Equipe Conectada",
    description: "Integração completa entre família, cuidadores e profissionais de saúde",
  },
  {
    icon: BarChart3,
    title: "Relatórios Inteligentes",
    description: "Análises detalhadas do bem-estar e evolução da saúde do seu familiar",
  },
  {
    icon: Clock,
    title: "Disponível 24/7",
    description: "Suporte técnico especializado sempre que você precisar",
  },
  {
    icon: TrendingUp,
    title: "Resultados Comprovados",
    description: "95% das famílias relatam melhoria na organização dos cuidados",
  },
];

const FeaturesSection = () => {
  return (
    <section className="section-padding bg-white">
      <div className="container-custom mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Recursos que fazem a diferença
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tecnologia de ponta aliada ao cuidado humano
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-xl bg-section-light hover:bg-white border border-transparent hover:border-border hover:shadow-lg transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                <feature.icon className="w-6 h-6 text-primary group-hover:text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
