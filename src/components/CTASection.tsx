import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="section-padding bg-primary">
      <div className="container-custom mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Comece hoje mesmo
        </h2>
        <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
          Junte-se a <strong>milhares de famílias</strong> que já descobriram como cuidar melhor de
          quem mais amam. <strong>Teste grátis por 7 dias.</strong>
        </p>
        <Button
          size="lg"
          className="bg-white text-primary hover:bg-white/90 gap-2 px-8"
        >
          Começar Teste Grátis
          <ArrowRight className="w-4 h-4" />
        </Button>
        <p className="text-sm text-white/70 mt-4">
          Sem compromisso • Cancele quando quiser • Suporte incluído
        </p>
      </div>
    </section>
  );
};

export default CTASection;
