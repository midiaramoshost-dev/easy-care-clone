import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Maria Silva",
    role: "Filha e cuidadora",
    avatar: "MS",
    content: "O CuidadoFácil transformou a forma como cuido da minha mãe. Agora tenho tranquilidade mesmo quando não estou por perto.",
    rating: 5,
  },
  {
    name: "João Santos",
    role: "Cuidador profissional",
    avatar: "JS",
    content: "A plataforma facilita muito o meu trabalho. Consigo manter a família informada e organizar todas as atividades do dia.",
    rating: 5,
  },
  {
    name: "Ana Costa",
    role: "Enfermeira",
    avatar: "AC",
    content: "Recomendo para todas as famílias. Os relatórios de saúde são completos e ajudam muito no acompanhamento médico.",
    rating: 5,
  },
];

const NewTestimonialsSection = () => {
  return (
    <section className="section-padding bg-card relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      
      <div className="container-custom mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary-light text-primary text-sm font-medium mb-4">
            Depoimentos
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            O que dizem sobre nós
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Milhares de famílias já confiam no CuidadoFácil para cuidar de quem amam
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative p-8 rounded-2xl bg-background border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all group"
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-primary/10 group-hover:text-primary/20 transition-colors" />
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold text-lg">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
              
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-warning text-warning" />
                ))}
              </div>
              
              <p className="text-muted-foreground leading-relaxed">
                "{testimonial.content}"
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewTestimonialsSection;
