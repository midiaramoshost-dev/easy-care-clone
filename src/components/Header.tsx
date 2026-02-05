import { Button } from "@/components/ui/button";
import { Settings, Heart, LogIn, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { to: "/admin", icon: Settings, label: "Admin", variant: "outline" as const },
    { to: "/cuidador", icon: Heart, label: "Área do Cuidador", variant: "ghost" as const },
    { to: "/cliente", icon: LogIn, label: "Área do Cliente", variant: "ghost" as const },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
      <div className="container-custom mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold text-primary">CuidadoFácil</span>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            {menuItems.map((item) => (
              <Button key={item.to} variant={item.variant} size="sm" className="gap-2" asChild>
                <Link to={item.to}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
              <Link to="/comecar">Começar Agora</Link>
            </Button>
          </nav>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button className="md:hidden" variant="ghost" size="sm">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <nav className="flex flex-col gap-4 mt-8">
                {menuItems.map((item) => (
                  <Button
                    key={item.to}
                    variant={item.variant}
                    className="justify-start gap-2"
                    asChild
                    onClick={() => setIsOpen(false)}
                  >
                    <Link to={item.to}>
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  </Button>
                ))}
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground justify-start"
                  asChild
                  onClick={() => setIsOpen(false)}
                >
                  <Link to="/comecar">Começar Agora</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
