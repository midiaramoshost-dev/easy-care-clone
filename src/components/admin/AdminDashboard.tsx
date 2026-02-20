import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Calendar, BarChart3, TrendingUp, Activity, Heart, Send, Clock, Wallet, Building2, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

type Repasse = {
  institution_id: string;
  amount: number;
  status: string;
};

type Institution = {
  id: string;
  name: string;
  active: boolean;
};

export function AdminDashboard() {
  const [instFilter, setInstFilter] = useState("all");

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

  const { data: donations = [] } = useQuery({
    queryKey: ["admin-donations-raw"],
    queryFn: async () => {
      const { data, error } = await supabase.from("donations").select("amount, status");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: repasses = [] } = useQuery({
    queryKey: ["admin-repasses-raw"],
    queryFn: async () => {
      const { data, error } = await supabase.from("repasses").select("institution_id, amount, status");
      if (error) throw error;
      return (data || []) as Repasse[];
    },
  });

  const { data: institutions = [] } = useQuery({
    queryKey: ["institutions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("institutions").select("id, name, active").order("name");
      if (error) throw error;
      return (data || []) as Institution[];
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

  // ── Filtered stats ──────────────────────────────────────────────────────────
  const filteredRepasses = instFilter === "all"
    ? repasses
    : repasses.filter((r) => r.institution_id === instFilter);

  const totalDonated = donations.reduce((s, d) => d.status === "paid" ? s + Number(d.amount) : s, 0);
  const totalRepassed = filteredRepasses.reduce((s, r) => r.status === "paid" ? s + Number(r.amount) : s, 0);
  const pendingRepasses = filteredRepasses.reduce((s, r) => r.status === "pending" ? s + Number(r.amount) : s, 0);
  const balance = totalDonated - repasses.reduce((s, r) => r.status === "paid" ? s + Number(r.amount) : s, 0);

  const repassedPct = totalDonated > 0 ? Math.min(100, (totalRepassed / totalDonated) * 100) : 0;

  const selectedInst = institutions.find((i) => i.id === instFilter);

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

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

      {/* Donations & Repasses section */}
      <div>
        {/* Section header with filter */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            Doações e Repasses
            {instFilter !== "all" && selectedInst && (
              <Badge variant="secondary" className="ml-1 font-normal">
                <Building2 className="h-3 w-3 mr-1" />{selectedInst.name}
              </Badge>
            )}
          </h3>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={instFilter} onValueChange={setInstFilter}>
              <SelectTrigger className="w-[220px] bg-background">
                <SelectValue placeholder="Filtrar por instituição" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">Todas as instituições</SelectItem>
                {institutions.map((i) => (
                  <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Arrecadado</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{fmt(totalDonated)}</div>
              <p className="text-xs text-muted-foreground">Pool total de doações confirmadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {instFilter === "all" ? "Total Repassado" : "Repassado à Instituição"}
              </CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fmt(totalRepassed)}</div>
              <p className="text-xs text-muted-foreground">
                {instFilter === "all" ? "Todas as transferências pagas" : `Pago a ${selectedInst?.name}`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Repasses Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fmt(pendingRepasses)}</div>
              <p className="text-xs text-muted-foreground">
                {instFilter === "all" ? "Aguardando confirmação" : `Pendente para ${selectedInst?.name}`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Disponível</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${balance > 0 ? "text-primary" : ""}`}>{fmt(balance)}</div>
              <p className="text-xs text-muted-foreground">Total arrecadado − repassado</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress bar */}
        {totalDonated > 0 && (
          <Card className="mt-4">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {instFilter === "all"
                    ? "Progresso de repasse — todas as instituições"
                    : `Progresso de repasse — ${selectedInst?.name}`}
                </span>
                <span className="text-sm font-semibold text-primary">{repassedPct.toFixed(1)}%</span>
              </div>
              <Progress value={repassedPct} className="h-2" />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-muted-foreground">Repassado: {fmt(totalRepassed)}</span>
                <span className="text-xs text-muted-foreground">Arrecadado: {fmt(totalDonated)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Per-institution breakdown (visible only when "all" selected and there are institutions with repasses) */}
        {instFilter === "all" && institutions.length > 0 && repasses.length > 0 && (
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" />Por Instituição
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {institutions
                .map((inst) => {
                  const instRepasses = repasses.filter((r) => r.institution_id === inst.id);
                  const paid = instRepasses.filter((r) => r.status === "paid").reduce((s, r) => s + Number(r.amount), 0);
                  const pending = instRepasses.filter((r) => r.status === "pending").reduce((s, r) => s + Number(r.amount), 0);
                  return { inst, paid, pending, total: instRepasses.length };
                })
                .filter((row) => row.total > 0)
                .sort((a, b) => b.paid - a.paid)
                .map(({ inst, paid, pending }) => (
                  <div key={inst.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{inst.name}</p>
                        {pending > 0 && (
                          <p className="text-xs text-muted-foreground">+ {fmt(pending)} pendente</p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-primary">{fmt(paid)}</span>
                  </div>
                ))}
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
