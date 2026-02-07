import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Shield, Heart, Users } from "lucide-react";
import heroCare from "@/assets/hero-care.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen pt-20 overflow-hidden gradient-mesh">
      {/* Decorative elements */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-accent/10 to-primary/10 rounded-full blur-3xl" />
      
      <div className="container-custom mx-auto px-4 md:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center min-h-[calc(100vh-5rem)] py-12">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-light border border-trust-border mb-8"
            >
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Certificado LGPD • ISO 27001 • 100% Seguro</span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] mb-6">
              <span className="text-foreground">Cuidado que </span>
              <span className="text-gradient">transforma</span>
              <br />
              <span className="text-foreground">vidas</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-xl">
              Plataforma completa de monitoramento e cuidado para idosos.
            </p>
            <p className="text-lg md:text-xl mb-10 max-w-xl">
              <span className="font-semibold text-foreground">Tecnologia, carinho e segurança</span>
              <span className="text-muted-foreground"> em um só lugar.</span>
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground gap-2 px-8 h-14 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Começar Gratuitamente
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="gap-2 px-8 h-14 text-lg rounded-xl border-2 hover:bg-primary-light"
              >
                <Play className="w-5 h-5" />
                Ver Demonstração
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-sm font-medium border-2 border-background"
                    >
                      {i === 1 && <Heart className="w-4 h-4" />}
                      {i === 2 && <Users className="w-4 h-4" />}
                      {i === 3 && <Shield className="w-4 h-4" />}
                      {i === 4 && "+"}
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-foreground">+10.000 famílias</p>
                  <p className="text-muted-foreground">já confiam em nós</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex text-warning">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">4.9/5 (2.000+ avaliações)</span>
              </div>
            </div>
          </motion.div>

          {/* Right Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="relative">
              {/* Main image container */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={heroCare}
                  alt="Cuidador profissional auxiliando idosa com carinho e atenção"
                  className="w-full h-[500px] lg:h-[600px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent" />
              </div>

              {/* Floating card 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute -left-6 top-1/4 glass-effect rounded-2xl p-4 shadow-xl border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Heart className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Saúde monitorada</p>
                    <p className="text-sm text-muted-foreground">24 horas por dia</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating card 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="absolute -right-6 bottom-1/4 glass-effect rounded-2xl p-4 shadow-xl border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">100% Seguro</p>
                    <p className="text-sm text-muted-foreground">Dados protegidos</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
