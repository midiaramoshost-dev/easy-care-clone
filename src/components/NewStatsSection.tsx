import { motion } from "framer-motion";
import { Heart, Clock, Star, Users } from "lucide-react";

const stats = [
  { 
    value: "500+", 
    label: "Famílias Atendidas",
    icon: Users,
    gradient: "from-primary to-accent"
  },
  { 
    value: "24/7", 
    label: "Monitoramento",
    icon: Clock,
    gradient: "from-accent to-primary"
  },
  { 
    value: "98%", 
    label: "Satisfação",
    icon: Heart,
    gradient: "from-primary to-accent"
  },
  { 
    value: "5★", 
    label: "Avaliação",
    icon: Star,
    gradient: "from-accent to-primary"
  },
];

const NewStatsSection = () => {
  return (
    <section className="py-16 bg-card relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-50" />
      
      <div className="container-custom mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-6 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all group"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <stat.icon className="w-7 h-7 text-primary" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewStatsSection;
