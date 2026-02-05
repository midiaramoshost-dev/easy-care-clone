import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "O CuidadoFácil revolucionou o acompanhamento dos meus pacientes. A família participa ativamente e os resultados são excepcionais.",
    author: "Dr. Carlos Mendes",
    role: "Geriatra - CRM 12345",
    avatar: "CM",
  },
  {
    quote:
      "Não consigo mais imaginar cuidar da minha mãe sem esta plataforma. Organização total e tranquilidade para toda família.",
    author: "Ana Beatriz Santos",
    role: "Filha e Administradora",
    avatar: "AB",
  },
  {
    quote:
      "Ferramenta indispensável no meu trabalho. Os relatórios facilitam muito a comunicação com a família e médicos.",
    author: "Enfermeira Márcia Silva",
    role: "Cuidadora Profissional",
    avatar: "MS",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="section-padding bg-white">
      <div className="container-custom mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Avaliações e Depoimentos de Clientes CuidadoFácil
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Depoimentos reais de profissionais e famílias que transformaram o cuidado
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-6 rounded-xl bg-section-light border border-border hover:shadow-lg transition-all duration-300"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-foreground mb-6 italic">"{testimonial.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
