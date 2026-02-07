import { motion } from "framer-motion";
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
    <section className="section-padding bg-background relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      
      <div className="container-custom mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary-light text-primary text-sm font-medium mb-6">
              Tecnologia
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Inteligência artificial que
              <br />
              <span className="text-gradient">protege quem você ama</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Nossa IA aprende os padrões de saúde do seu familiar e envia alertas preventivos antes que problemas aconteçam.
            </p>
            <ul className="space-y-5">
              {features.map((feature, index) => (
                <motion.li 
                  key={index} 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="text-foreground font-medium text-lg">{feature}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={technologyCare}
                alt="Dashboard do aplicativo CuidadoFácil"
                className="w-full h-[450px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent" />
            </div>
            
            {/* Floating stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="absolute -bottom-6 -left-6 glass-effect rounded-2xl p-5 shadow-xl border border-border/50"
            >
              <div className="text-3xl font-bold text-foreground mb-1">95%</div>
              <p className="text-sm text-muted-foreground">Precisão na detecção</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TechnologySection;
