import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Heart, TrendingUp, DollarSign, Users, Search, RefreshCw, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { format, eachMonthOfInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "secondary" },
  paid: { label: "Pago", variant: "default" },
  failed: { label: "Falhou", variant: "destructive" },
  refunded: { label: "Estornado", variant: "outline" },
};

const STATUS_COLORS: Record<string, string> = {
  paid: "hsl(var(--primary))",
  pending: "hsl(var(--muted-foreground))",
  failed: "hsl(var(--destructive))",
  refunded: "hsl(var(--accent))",
};

type Donation = {
  id: string;
  donor_name: string;
  donor_email: string;
  amount: number;
  status: string;
  message: string | null;
  created_at: string;
};

type DonorSummary = {
  email: string;
  name: string;
  total: number;
  count: number;
  donations: Donation[];
};

export function AdminDonations() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDonor, setSelectedDonor] = useState<DonorSummary | null>(null);

  const { data: donations = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-donations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Donation[];
    },
  });

  const filtered = donations.filter((d) => {
    const matchSearch =
      !search ||
      d.donor_name.toLowerCase().includes(search.toLowerCase()) ||
      d.donor_email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalAmount = donations.reduce((sum, d) => (d.status === "paid" ? sum + Number(d.amount) : sum), 0);
  const pendingAmount = donations.reduce((sum, d) => (d.status === "pending" ? sum + Number(d.amount) : sum), 0);
  const totalDonors = new Set(donations.map((d) => d.donor_email)).size;

  // Donor summaries map
  const donorMap = donations.reduce<Record<string, DonorSummary>>((acc, d) => {
    if (!acc[d.donor_email]) {
      acc[d.donor_email] = { email: d.donor_email, name: d.donor_name, total: 0, count: 0, donations: [] };
    }
    if (d.status === "paid") acc[d.donor_email].total += Number(d.amount);
    acc[d.donor_email].count += 1;
    acc[d.donor_email].donations.push(d);
    return acc;
  }, {});

  // Monthly trend
  const monthlyData = eachMonthOfInterval({ start: subMonths(new Date(), 5), end: new Date() }).map((month) => {
    const label = format(month, "MMM/yy", { locale: ptBR });
    const monthStr = format(month, "yyyy-MM");
    const monthDonations = donations.filter((d) => d.created_at.startsWith(monthStr) && d.status === "paid");
    return { month: label, total: monthDonations.reduce((s, d) => s + Number(d.amount), 0), quantidade: monthDonations.length };
  });

  // Status pie
  const statusData = Object.entries(
    donations.reduce<Record<string, number>>((acc, d) => { acc[d.status] = (acc[d.status] || 0) + 1; return acc; }, {})
  ).map(([status, count]) => ({ name: statusLabels[status]?.label || status, value: count, color: STATUS_COLORS[status] || "hsl(var(--muted))" }));

  // Top donors bar
  const topDonors = Object.values(donorMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((d) => ({ name: d.name, total: d.total }));

  const handleMarkPaid = async (id: string) => {
    const { error } = await supabase.from("donations").update({ status: "paid" }).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Doação marcada como paga!" }); refetch(); }
  };

  const handleMarkFailed = async (id: string) => {
    const { error } = await supabase.from("donations").update({ status: "failed" }).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Doação marcada como falha." }); refetch(); }
  };

  const openDonorDetail = (email: string) => {
    setSelectedDonor(donorMap[email] || null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Doações</h2>
          <p className="text-muted-foreground">Gestão das doações para asilos de Sorocaba</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />Atualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Recebido", value: `R$ ${totalAmount.toFixed(2).replace(".", ",")}`, sub: "Doações confirmadas", icon: DollarSign, colored: true },
          { label: "Pendente", value: `R$ ${pendingAmount.toFixed(2).replace(".", ",")}`, sub: "Aguardando confirmação", icon: TrendingUp },
          { label: "Total de Doações", value: String(donations.length), sub: "Registros totais", icon: Heart },
          { label: "Doadores Únicos", value: String(totalDonors), sub: "E-mails distintos", icon: Users },
        ].map(({ label, value, sub, icon: Icon, colored }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${colored ? "text-primary" : ""}`}>{value}</div>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Arrecadação Mensal (Confirmadas)</CardTitle></CardHeader>
          <CardContent>
            {monthlyData.every((m) => m.total === 0) ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Nenhuma doação confirmada ainda.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Total"]} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Doações por Status</CardTitle></CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Sem dados ainda.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Legend iconType="circle" iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {topDonors.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Top 5 Doadores (por valor confirmado)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topDonors} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={120} />
                <Tooltip formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Total doado"]} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou e-mail..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="failed">Falhou</SelectItem>
            <SelectItem value="refunded">Estornado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">Carregando doações...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Heart className="h-8 w-8 opacity-30" />
              <p>Nenhuma doação encontrada.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doador</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((donation) => {
                  const st = statusLabels[donation.status] || { label: donation.status, variant: "outline" as const };
                  return (
                    <TableRow
                      key={donation.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openDonorDetail(donation.donor_email)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium text-sm">{donation.donor_name}</p>
                            <p className="text-xs text-muted-foreground">{donation.donor_email}</p>
                          </div>
                          <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-primary">R$ {Number(donation.amount).toFixed(2).replace(".", ",")}</span>
                      </TableCell>
                      <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                      <TableCell>
                        <p className="text-xs text-muted-foreground max-w-[180px] truncate">{donation.message || "—"}</p>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{new Date(donation.created_at).toLocaleString("pt-BR")}</span>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        {donation.status === "pending" && (
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleMarkPaid(donation.id)}>Confirmar</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => handleMarkFailed(donation.id)}>Cancelar</Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Donor Detail Sheet */}
      <Sheet open={!!selectedDonor} onOpenChange={(open) => !open && setSelectedDonor(null)}>
        <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto">
          {selectedDonor && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle>{selectedDonor.name}</SheetTitle>
                <SheetDescription>{selectedDonor.email}</SheetDescription>
              </SheetHeader>

              {/* Donor KPIs */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total doado</p>
                  <p className="font-bold text-primary text-sm">R$ {selectedDonor.total.toFixed(2).replace(".", ",")}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Doações</p>
                  <p className="font-bold text-sm">{selectedDonor.count}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Confirmadas</p>
                  <p className="font-bold text-sm">{selectedDonor.donations.filter((d) => d.status === "paid").length}</p>
                </div>
              </div>

              <Separator className="mb-4" />

              <h3 className="font-semibold text-sm mb-3">Histórico de Doações</h3>
              <div className="space-y-3">
                {selectedDonor.donations.map((d) => {
                  const st = statusLabels[d.status] || { label: d.status, variant: "outline" as const };
                  return (
                    <div key={d.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary">R$ {Number(d.amount).toFixed(2).replace(".", ",")}</span>
                        <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                      </div>
                      {d.message && (
                        <p className="text-xs text-muted-foreground italic">"{d.message}"</p>
                      )}
                      <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString("pt-BR")}</p>
                      {d.status === "pending" && (
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => handleMarkPaid(d.id)}>Confirmar</Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs flex-1 text-destructive hover:text-destructive" onClick={() => handleMarkFailed(d.id)}>Cancelar</Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default AdminDonations;
