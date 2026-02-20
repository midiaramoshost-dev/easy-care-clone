import { Heart, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      
      <div className="container-custom mx-auto px-4 md:px-8 py-16 relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div>
            <h3 className="text-2xl mb-4 flex items-baseline gap-0.5">
              <span className="font-black tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Cuidado</span>
              <span className="font-light tracking-widest text-gray-300">Fácil</span>
            </h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Plataforma completa de monitoramento e cuidado para idosos, unindo tecnologia e carinho.
            </p>
            <div className="flex flex-col gap-3">
              <a href="mailto:contato@cuidadofacil.com.br" className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors">
                <Mail className="w-4 h-4" />
                contato@cuidadofacil.com.br
              </a>
              <a href="tel:+551140028922" className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors">
                <Phone className="w-4 h-4" />
                (11) 4002-8922
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-6">Produto</h4>
            <ul className="space-y-3 text-gray-400">
              <li><a href="#" className="hover:text-primary transition-colors">Recursos</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Preços</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Demonstração</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Para Empresas</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-6">Suporte</h4>
            <ul className="space-y-3 text-gray-400">
              <li><a href="#" className="hover:text-primary transition-colors">Central de Ajuda</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contato</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Status do Sistema</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-6">Legal</h4>
            <ul className="space-y-3 text-gray-400">
              <li><a href="#" className="hover:text-primary transition-colors">Política de Privacidade</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Conformidade LGPD</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © 2024 CuidadoFácil. Todos os direitos reservados.
          </p>
          <p className="text-sm text-gray-400 flex items-center gap-1">
            Feito com <Heart className="w-4 h-4 text-destructive fill-destructive" /> no Brasil
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
