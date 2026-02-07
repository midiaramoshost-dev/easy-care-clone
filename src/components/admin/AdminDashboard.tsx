import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, BarChart3, TrendingUp } from "lucide-react";

const stats = [
  {
    title: "Total de Clientes",
    value: "1,234",
    change: "+12% este mês",
    icon: Users,
  },
  {
    title: "Cuidadores Ativos",
    value: "89",
    change: "+5 novos esta semana",
    icon: TrendingUp,
  },
  {
    title: "Atendimentos Hoje",
    value: "156",
    change: "98% concluídos",
    icon: Calendar,
  },
  {
    title: "Satisfação",
    value: "4.9",
    change: "Média geral",
    icon: BarChart3,
  },
];

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Visão geral do sistema CuidadoFácil
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas ações no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "Novo cliente cadastrado", user: "Maria Silva", time: "Há 5 min" },
                { action: "Agendamento confirmado", user: "João Santos", time: "Há 15 min" },
                { action: "Avaliação recebida", user: "Ana Oliveira", time: "Há 30 min" },
                { action: "Cuidador aprovado", user: "Carlos Lima", time: "Há 1 hora" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{item.user}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Acesse funções comuns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="p-3 rounded-lg bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors">
              <p className="text-sm font-medium">Aprovar Cuidadores</p>
              <p className="text-xs text-muted-foreground">3 pendentes</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors">
              <p className="text-sm font-medium">Resolver Tickets</p>
              <p className="text-xs text-muted-foreground">7 abertos</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors">
              <p className="text-sm font-medium">Gerar Relatório</p>
              <p className="text-xs text-muted-foreground">Mensal</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminDashboard;
