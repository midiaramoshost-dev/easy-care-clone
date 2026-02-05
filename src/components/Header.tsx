import { Button } from "@/components/ui/button";
import { Settings, Heart, LogIn } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
      <div className="container-custom mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center">
            <span className="text-xl font-bold text-primary">CuidadoFácil</span>
          </a>

          <nav className="hidden md:flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="w-4 h-4" />
              Admin
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <Heart className="w-4 h-4" />
              Área do Cuidador
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <LogIn className="w-4 h-4" />
              Área do Cliente
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary-dark text-primary-foreground">
              Começar Agora
            </Button>
          </nav>

          <Button className="md:hidden" variant="ghost" size="sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
