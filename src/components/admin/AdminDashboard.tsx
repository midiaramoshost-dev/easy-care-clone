import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, BarChart3, TrendingUp, Activity, Heart, Send, Clock, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";

export function AdminDashboard() {
  const { data: profilesCount = 0 } = useQuery({
    queryKey: ["admin-profiles-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: appointmentsToday = 0 } = useQuery({
    queryKey: ["admin-appointments-today"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { count, error } = await supabase.from("appointments").select("*", { count: "exact", head: true }).eq("scheduled_date", today);
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: caregiversCount = 0 } = useQuery({
    queryKey: ["admin-caregivers-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("caregivers").select("*", { count: "exact", head: true }).eq("active", true);
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: avgRating = "—" } = useQuery({
    queryKey: ["admin-avg-rating"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("rating");
      if (error) throw error;
      if (!data || data.length === 0) return "—";
      const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
      return avg.toFixed(1);
    },
  });

  const { data: donationStats = { totalDonated: 0, totalRepassed: 0, pendingRepasses: 0, balance: 0 } } = useQuery({
    queryKey: ["admin-donation-stats"],
    queryFn: async () => {
      const [donationsRes, repassesRes] = await Promise.all([
        supabase.from("donations").select("amount, status"),
        supabase.from("repasses").select("amount, status"),
      ]);
      if (donationsRes.error) throw donationsRes.error;
      if (repassesRes.error) throw repassesRes.error;

      const totalDonated = (donationsRes.data || []).reduce(
        (s, d) => d.status === "paid" ? s + Number(d.amount) : s, 0
      );
      const totalRepassed = (repassesRes.data || []).reduce(
        (s, r) => r.status === "paid" ? s + Number(r.amount) : s, 0
      );
      const pendingRepasses = (repassesRes.data || []).reduce(
        (s, r) => r.status === "pending" ? s + Number(r.amount) : s, 0
      );
      return { totalDonated, totalRepassed, pendingRepasses, balance: totalDonated - totalRepassed };
    },
  });

  const { data: recentActivities = [] } = useQuery({
    queryKey: ["admin-recent-activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_activities")
        .select("*, profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
  const repassedPct = donationStats.totalDonated > 0
    ? Math.min(100, (donationStats.totalRepassed / donationStats.totalDonated) * 100)
    : 0;

  const stats = [
    { title: "Total de Usuários", value: String(profilesCount), change: "cadastrados", icon: Users },
    { title: "Cuidadores Ativos", value: String(caregiversCount), change: "com perfil ativo", icon: TrendingUp },
    { title: "Atendimentos Hoje", value: String(appointmentsToday), change: "agendados", icon: Calendar },
    { title: "Satisfação", value: avgRating, change: "Média geral", icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Visão geral do sistema CuidadoFácil</p>
      </div>

      {/* General KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Donations & Repasses KPIs */}
      <div>
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Heart className="h-4 w-4 text-primary" />
          Doações e Repasses
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Arrecadado</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{fmt(donationStats.totalDonated)}</div>
              <p className="text-xs text-muted-foreground">Doações confirmadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Repassado</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fmt(donationStats.totalRepassed)}</div>
              <p className="text-xs text-muted-foreground">Transferências pagas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Repasses Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fmt(donationStats.pendingRepasses)}</div>
              <p className="text-xs text-muted-foreground">Aguardando confirmação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Disponível</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${donationStats.balance > 0 ? "text-primary" : ""}`}>
                {fmt(donationStats.balance)}
              </div>
              <p className="text-xs text-muted-foreground">Para novos repasses</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress bar */}
        {donationStats.totalDonated > 0 && (
          <Card className="mt-4">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progresso de repasse às instituições</span>
                <span className="text-sm font-semibold text-primary">{repassedPct.toFixed(1)}%</span>
              </div>
              <Progress value={repassedPct} className="h-2" />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-muted-foreground">Repassado: {fmt(donationStats.totalRepassed)}</span>
                <span className="text-xs text-muted-foreground">Arrecadado: {fmt(donationStats.totalDonated)}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5" /> Atividade Recente</CardTitle>
            <CardDescription>Últimas ações no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma atividade registrada ainda.</p>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{item.action}</p>
                      <p className="text-xs text-muted-foreground">{item.profiles?.full_name || "Sistema"}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
              <p className="text-xs text-muted-foreground">Gerenciar perfis</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors">
              <p className="text-sm font-medium">Ver Agendamentos</p>
              <p className="text-xs text-muted-foreground">Todos os atendimentos</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors">
              <p className="text-sm font-medium">Relatórios</p>
              <p className="text-xs text-muted-foreground">Métricas e análises</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminDashboard;
