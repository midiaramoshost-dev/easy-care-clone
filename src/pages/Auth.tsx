import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Heart, User, ShieldCheck, Clock, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Link } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'Senha deve ter pelo menos 6 caracteres' }),
});

const signupSchema = z.object({
  fullName: z.string().trim().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
  email: z.string().trim().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'Senha deve ter pelo menos 6 caracteres' }),
  role: z.enum(['cliente', 'cuidador'], { required_error: 'Selecione um tipo de conta' }),
  camerasQuantity: z.number().int().min(0, { message: 'Quantidade inválida' }).max(50, { message: 'Máximo de 50 câmeras' }),
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

const Auth = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginForm, setLoginForm] = useState<LoginForm>({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState<SignupForm>({
    fullName: '',
    email: '',
    password: '',
    role: 'cliente',
    camerasQuantity: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const from = (location.state as { from?: Location })?.from?.pathname || '/';

  useEffect(() => {
    if (user && !loading) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = loginSchema.safeParse(loginForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setIsSubmitting(true);
    const { error } = await signIn(loginForm.email, loginForm.password);
    setIsSubmitting(false);
    if (error) {
      let errorMessage = 'Erro ao fazer login. Tente novamente.';
      if (error.message.includes('Invalid login credentials')) errorMessage = 'Email ou senha incorretos.';
      else if (error.message.includes('Email not confirmed')) errorMessage = 'Confirme seu email antes de fazer login.';
      toast({ variant: 'destructive', title: 'Erro no login', description: errorMessage });
    } else {
      toast({ title: 'Bem-vindo!', description: 'Login realizado com sucesso.' });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = signupSchema.safeParse(signupForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setIsSubmitting(true);
    const { error } = await signUp(signupForm.email, signupForm.password, signupForm.role, signupForm.fullName, signupForm.camerasQuantity);
    setIsSubmitting(false);
    if (error) {
      let errorMessage = 'Erro ao criar conta. Tente novamente.';
      if (error.message.includes('User already registered')) errorMessage = 'Este email já está cadastrado.';
      else if (error.message.includes('Password')) errorMessage = 'A senha não atende aos requisitos mínimos.';
      toast({ variant: 'destructive', title: 'Erro no cadastro', description: errorMessage });
    } else {
      toast({ title: 'Conta criada!', description: 'Verifique seu email para confirmar o cadastro.' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-accent relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground w-full">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <span className="font-bold text-lg">CF</span>
            </div>
            <span className="text-2xl font-bold">CuidadoFácil</span>
          </Link>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold leading-tight mb-4">
                Cuidado profissional para quem você ama
              </h1>
              <p className="text-lg text-primary-foreground/80">
                Plataforma completa para gestão de cuidadores, acompanhamento de saúde e tranquilidade da família.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Segurança garantida</p>
                  <p className="text-xs text-primary-foreground/70">Cuidadores verificados e avaliados</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Acompanhamento 24h</p>
                  <p className="text-xs text-primary-foreground/70">Diário de cuidados em tempo real</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Família conectada</p>
                  <p className="text-xs text-primary-foreground/70">Todos informados a qualquer momento</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-primary-foreground/50">
            © {new Date().getFullYear()} CuidadoFácil. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              CuidadoFácil
            </span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-bold text-foreground">Acesse sua conta</h2>
              <p className="text-muted-foreground mt-1">Entre ou crie sua conta para continuar</p>
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-11">
                <TabsTrigger value="login" className="text-sm font-medium">Entrar</TabsTrigger>
                <TabsTrigger value="signup" className="text-sm font-medium">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-5 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="h-11"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-sm font-medium">Senha</Label>
                      <button type="button" className="text-xs text-primary hover:underline">
                        Esqueceu a senha?
                      </button>
                    </div>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      className="h-11"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    />
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>
                  <Button type="submit" className="w-full h-11 font-semibold" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-5 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-sm font-medium">Nome completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Seu nome completo"
                      className="h-11"
                      value={signupForm.fullName}
                      onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                    />
                    {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="h-11"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      className="h-11"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    />
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Tipo de conta</Label>
                    <RadioGroup
                      value={signupForm.role}
                      onValueChange={(value) =>
                        setSignupForm({ ...signupForm, role: value as 'cliente' | 'cuidador' })
                      }
                      className="grid grid-cols-2 gap-3"
                    >
                      <div className="relative">
                        <RadioGroupItem value="cliente" id="role-cliente" className="peer sr-only" />
                        <Label
                          htmlFor="role-cliente"
                          className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-card p-4 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5 cursor-pointer transition-all"
                        >
                          <User className="w-5 h-5 mb-1.5 text-primary" />
                          <span className="font-semibold text-sm">Cliente</span>
                          <span className="text-xs text-muted-foreground">Busco cuidado</span>
                        </Label>
                      </div>
                      <div className="relative">
                        <RadioGroupItem value="cuidador" id="role-cuidador" className="peer sr-only" />
                        <Label
                          htmlFor="role-cuidador"
                          className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-card p-4 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5 cursor-pointer transition-all"
                        >
                          <Heart className="w-5 h-5 mb-1.5 text-accent" />
                          <span className="font-semibold text-sm">Cuidador</span>
                          <span className="text-xs text-muted-foreground">Ofereço cuidado</span>
                        </Label>
                      </div>
                    </RadioGroup>
                    {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
                  </div>
                  <Button type="submit" className="w-full h-11 font-semibold" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      'Criar conta'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <p className="text-center text-xs text-muted-foreground">
              Ao continuar, você concorda com nossos{' '}
              <a href="#" className="text-primary hover:underline">Termos de Uso</a>{' '}
              e{' '}
              <a href="#" className="text-primary hover:underline">Política de Privacidade</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
