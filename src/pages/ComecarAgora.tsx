import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Heart, User, Phone, Mail, MapPin, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const ComecarAgora = () => {
  const [tipoSelecionado, setTipoSelecionado] = useState<"cliente" | "cuidador" | null>(null);

  const beneficios = [
    "Cuidadores verificados e treinados",
    "Atendimento 24 horas",
    "Monitoramento em tempo real",
    "Suporte especializado",
    "Planos flexíveis",
    "Satisfação garantida",
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-primary ml-4">Começar Agora</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Junte-se à família CuidadoFácil</h2>
            <p className="text-muted-foreground text-lg">
              Escolha como você quer fazer parte da nossa comunidade
            </p>
          </div>

          {!tipoSelecionado ? (
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card
                className="cursor-pointer hover:shadow-lg transition-all hover:border-primary"
                onClick={() => setTipoSelecionado("cliente")}
              >
                <CardHeader className="text-center">
                  <User className="w-16 h-16 mx-auto text-primary mb-4" />
                  <CardTitle className="text-2xl">Sou Cliente</CardTitle>
                  <CardDescription className="text-base">
                    Preciso de cuidadores para mim ou minha família
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {beneficios.slice(0, 3).map((beneficio, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500" />
                        {beneficio}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-4">Continuar como Cliente</Button>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-all hover:border-primary"
                onClick={() => setTipoSelecionado("cuidador")}
              >
                <CardHeader className="text-center">
                  <Heart className="w-16 h-16 mx-auto text-primary mb-4" />
                  <CardTitle className="text-2xl">Sou Cuidador</CardTitle>
                  <CardDescription className="text-base">
                    Quero oferecer meus serviços como cuidador profissional
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {beneficios.slice(3).map((beneficio, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500" />
                        {beneficio}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-4">Continuar como Cuidador</Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="max-w-xl mx-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {tipoSelecionado === "cliente" ? "Cadastro de Cliente" : "Cadastro de Cuidador"}
                    </CardTitle>
                    <CardDescription>Preencha seus dados para começar</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setTipoSelecionado(null)}>
                    Voltar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome Completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input id="nome" placeholder="Seu nome" className="pl-10" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input id="telefone" placeholder="(00) 00000-0000" className="pl-10" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="seu@email.com" className="pl-10" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input id="endereco" placeholder="Seu endereço completo" className="pl-10" />
                    </div>
                  </div>

                  {tipoSelecionado === "cuidador" && (
                    <div className="space-y-2">
                      <Label htmlFor="experiencia">Experiência</Label>
                      <Textarea
                        id="experiencia"
                        placeholder="Conte-nos sobre sua experiência como cuidador..."
                        rows={4}
                      />
                    </div>
                  )}

                  {tipoSelecionado === "cliente" && (
                    <div className="space-y-2">
                      <Label htmlFor="necessidades">Necessidades</Label>
                      <Textarea
                        id="necessidades"
                        placeholder="Descreva suas necessidades de cuidado..."
                        rows={4}
                      />
                    </div>
                  )}

                  <Button type="submit" className="w-full" size="lg">
                    Enviar Cadastro
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ComecarAgora;
