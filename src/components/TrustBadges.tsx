import { Shield, Lock, Award, CheckCircle, Clock } from "lucide-react";

const badges = [
  { icon: Lock, title: "SSL Seguro", subtitle: "Criptografia 256-bit" },
  { icon: Award, title: "ISO 27001", subtitle: "Certificado" },
  { icon: Shield, title: "Conformidade LGPD", subtitle: "100% Seguro" },
  { icon: Clock, title: "99.9% Uptime", subtitle: "Sempre Disponível" },
];

const TrustBadges = () => {
  return (
    <section className="py-12 bg-section-light border-y border-border">
      <div className="container-custom mx-auto px-4 md:px-8">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Confiado por mais de 500 famílias em todo o Brasil
        </p>

        <div className="flex flex-wrap justify-center items-center gap-8 mb-8">
          {[1, 2, 3, 4, 5].map((num) => (
            <div
              key={num}
              className="w-24 h-8 bg-gray-200 rounded flex items-center justify-center text-xs text-muted-foreground"
            >
              Empresa {num}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {badges.map((badge, index) => (
            <div key={index} className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center">
                <badge.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{badge.title}</div>
                <div className="text-xs text-muted-foreground">{badge.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
