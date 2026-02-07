import { motion } from "framer-motion";
import { Shield, Heart, Users, BarChart3, Clock, TrendingUp, Smartphone, Bell } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Segurança Total",
    description: "Dados protegidos com criptografia de nível bancário e conformidade LGPD",
    gradient: "from-primary to-accent",
  },
  {
    icon: Heart,
    title: "Cuidado Humanizado",
    description: "Tecnologia que fortalece o vínculo familiar e melhora a qualidade de vida",
    gradient: "from-accent to-primary",
  },
  {
    icon: Users,
    title: "Equipe Conectada",
    description: "Integração completa entre família, cuidadores e profissionais de saúde",
    gradient: "from-primary to-accent",
  },
  {
    icon: BarChart3,
    title: "Relatórios Inteligentes",
    description: "Análises detalhadas do bem-estar e evolução da saúde do seu familiar",
    gradient: "from-accent to-primary",
  },
  {
    icon: Clock,
    title: "Disponível 24/7",
    description: "Suporte técnico especializado sempre que você precisar",
    gradient: "from-primary to-accent",
  },
  {
    icon: Bell,
    title: "Alertas Personalizados",
    description: "Notificações em tempo real sobre medicamentos, consultas e bem-estar",
    gradient: "from-accent to-primary",
  },
  {
    icon: Smartphone,
    title: "App Intuitivo",
    description: "Interface simples e acessível para toda a família, de qualquer lugar",
    gradient: "from-primary to-accent",
  },
  {
    icon: TrendingUp,
    title: "Resultados Comprovados",
    description: "95% das famílias relatam melhoria na organização dos cuidados",
    gradient: "from-accent to-primary",
  },
];

const NewFeaturesSection = () => {
  return (
    <section className="section-padding bg-section-light relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      
      <div className="container-custom mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary-light text-primary text-sm font-medium mb-4">
            Recursos
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Tudo que você precisa para
            <br />
            <span className="text-gradient">cuidar de quem você ama</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tecnologia de ponta aliada ao cuidado humano para proporcionar tranquilidade à sua família
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewFeaturesSection;
