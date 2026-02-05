import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Calendar, Heart, Clock, Star, ArrowLeft, Phone, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const AreaCliente = () => {
  const meusCuidadores = [
    { id: 1, nome: "Ana Paula", especialidade: "Cuidado Geral", avaliacao: 4.9, foto: "AP" },
    { id: 2, nome: "Carlos Silva", especialidade: "Fisioterapia", avaliacao: 4.8, foto: "CS" },
  ];

  const proximosAgendamentos = [
    { id: 1, cuidador: "Ana Paula", data: "Hoje, 14:00", tipo: "Cuidado Diário" },
    { id: 2, cuidador: "Carlos Silva", data: "Amanhã, 10:00", tipo: "Fisioterapia" },
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
              <User className="w-6 h-6" />
              Área do Cliente
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
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Meus Cuidadores
                </CardTitle>
                <CardDescription>Profissionais que cuidam de você</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {meusCuidadores.map((cuidador) => (
                    <div
                      key={cuidador.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                          {cuidador.foto}
                        </div>
                        <div>
                          <h4 className="font-semibold">{cuidador.nome}</h4>
                          <p className="text-sm text-muted-foreground">{cuidador.especialidade}</p>
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            {cuidador.avaliacao}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Próximos Agendamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {proximosAgendamentos.map((agendamento) => (
                    <div
                      key={agendamento.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <h4 className="font-medium">{agendamento.cuidador}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {agendamento.data}
                        </div>
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                          {agendamento.tipo}
                        </span>
                      </div>
                      <Button variant="outline" size="sm">Detalhes</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardHeader>
                <CardTitle>Precisa de Ajuda?</CardTitle>
                <CardDescription>Estamos aqui para você 24/7</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" size="lg">
                  <Phone className="w-4 h-4 mr-2" />
                  Ligar Agora
                </Button>
                <Button variant="outline" className="w-full" size="lg">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat Online
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agendar Novo Atendimento</CardTitle>
                <CardDescription>Escolha o tipo de cuidado que você precisa</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" size="lg">
                  <Calendar className="w-4 h-4 mr-2" />
                  Agendar Agora
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AreaCliente;
