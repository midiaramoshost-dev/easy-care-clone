import { Button } from "@/components/ui/button";
import { LogIn, Menu, User, LogOut, LayoutDashboard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, roles, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getUserAreaLink = () => {
    if (roles.includes('admin')) return '/admin';
    if (roles.includes('cuidador')) return '/cuidador';
    if (roles.includes('cliente')) return '/cliente';
    return '/';
  };

  const getUserAreaLabel = () => {
    if (roles.includes('admin')) return 'Painel Admin';
    if (roles.includes('cuidador')) return 'Minha Área';
    if (roles.includes('cliente')) return 'Minha Área';
    return 'Minha Área';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/40 shadow-sm">
      <div className="container-custom mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <span className="flex items-baseline gap-0.5">
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Cuidado</span>
              <span className="text-xl font-light tracking-widest text-foreground/80">Fácil</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    {profile?.full_name || user.email?.split('@')[0] || 'Usuário'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to={getUserAreaLink()} className="cursor-pointer">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      {getUserAreaLabel()}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="gap-2" asChild>
                  <Link to="/auth">
                    <LogIn className="w-4 h-4" />
                    Entrar
                  </Link>
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
                  asChild
                >
                  <Link to="/comecar">Começar Agora</Link>
                </Button>
              </>
            )}
          </nav>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button className="md:hidden" variant="ghost" size="sm">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <nav className="flex flex-col gap-4 mt-8">
                {user ? (
                  <>
                    <div className="px-2 py-3 border-b">
                      <p className="font-medium">{profile?.full_name || user.email?.split('@')[0]}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Button variant="ghost" className="justify-start gap-2" asChild onClick={() => setIsOpen(false)}>
                      <Link to={getUserAreaLink()}>
                        <LayoutDashboard className="w-4 h-4" />
                        {getUserAreaLabel()}
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start gap-2 text-destructive hover:text-destructive"
                      onClick={() => { handleSignOut(); setIsOpen(false); }}
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="justify-start gap-2" asChild onClick={() => setIsOpen(false)}>
                      <Link to="/auth">
                        <LogIn className="w-4 h-4" />
                        Entrar
                      </Link>
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground justify-start"
                      asChild
                      onClick={() => setIsOpen(false)}
                    >
                      <Link to="/comecar">Começar Agora</Link>
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
