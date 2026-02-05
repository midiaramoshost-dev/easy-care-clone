import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Calendar, Clock, MapPin, Star, ArrowLeft, User } from "lucide-react";
import { Link } from "react-router-dom";

const AreaCuidador = () => {
  const proximosAtendimentos = [
    { id: 1, cliente: "Maria Silva", horario: "08:00 - 12:00", endereco: "Rua das Flores, 123", tipo: "Cuidado Diário" },
    { id: 2, cliente: "João Santos", horario: "14:00 - 18:00", endereco: "Av. Principal, 456", tipo: "Acompanhamento" },
    { id: 3, cliente: "Ana Costa", horario: "19:00 - 22:00", endereco: "Rua do Sol, 789", tipo: "Noturno" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <Heart className="w-6 h-6" />
              Área do Cuidador
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <User className="w-4 h-4 mr-2" />
              Meu Perfil
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Atendimentos Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">3</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-100 to-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avaliação Média</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 flex items-center gap-1">
                4.9 <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-100 to-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Horas este Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">128h</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Próximos Atendimentos
            </CardTitle>
            <CardDescription>Seus agendamentos para hoje</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {proximosAtendimentos.map((atendimento) => (
                <div
                  key={atendimento.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="space-y-1">
                    <h4 className="font-semibold">{atendimento.cliente}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {atendimento.horario}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {atendimento.endereco}
                      </span>
                    </div>
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                      {atendimento.tipo}
                    </span>
                  </div>
                  <Button size="sm">Iniciar</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AreaCuidador;
