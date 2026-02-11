import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Dr. Carlos Mendes",
    role: "Geriatra - CRM 12345",
    avatar: "CM",
    content: "O CuidadoFácil revolucionou a forma como acompanho meus pacientes. Os relatórios detalhados e alertas em tempo real me permitem oferecer um cuidado muito mais personalizado e eficiente.",
    rating: 5,
  },
  {
    name: "Ana Beatriz Santos",
    role: "Filha e Administradora",
    avatar: "AB",
    content: "Desde que começamos a usar o CuidadoFácil, a tranquilidade da nossa família aumentou enormemente. Saber que minha mãe está sendo bem cuidada, mesmo à distância, não tem preço.",
    rating: 5,
  },
  {
    name: "Enfermeira Márcia Silva",
    role: "Cuidadora Profissional",
    avatar: "MS",
    content: "A plataforma facilita muito o meu trabalho diário. Consigo registrar todas as atividades, medicamentos e observações de forma organizada e acessível para toda a família.",
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
            Avaliações e Depoimentos de Clientes CuidadoFácil
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Depoimentos reais de profissionais e famílias que transformaram o cuidado
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
