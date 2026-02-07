import { motion } from "framer-motion";
import { Shield, Lock, Award, Clock } from "lucide-react";

const badges = [
  { icon: Lock, title: "SSL Seguro", subtitle: "Criptografia 256-bit" },
  { icon: Award, title: "ISO 27001", subtitle: "Certificado" },
  { icon: Shield, title: "Conformidade LGPD", subtitle: "100% Seguro" },
  { icon: Clock, title: "99.9% Uptime", subtitle: "Sempre Disponível" },
];

const companies = ["Hospital Sírio-Libanês", "Einstein", "Unimed", "Bradesco Saúde", "SulAmérica"];

const TrustBadges = () => {
  return (
    <section className="py-16 bg-card border-y border-border/50 relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-20" />
      
      <div className="container-custom mx-auto px-4 md:px-8 relative z-10">
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-muted-foreground mb-8"
        >
          Confiado por mais de 10.000 famílias e parceiros em todo o Brasil
        </motion.p>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center items-center gap-8 md:gap-12 mb-12"
        >
          {companies.map((company, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="px-6 py-3 rounded-xl bg-background/50 border border-border/50 text-sm text-muted-foreground font-medium hover:border-primary/30 hover:text-foreground transition-all"
            >
              {company}
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {badges.map((badge, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 justify-center p-4 rounded-xl bg-background/50 border border-border/50 hover:border-primary/30 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <badge.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{badge.title}</div>
                <div className="text-xs text-muted-foreground">{badge.subtitle}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
