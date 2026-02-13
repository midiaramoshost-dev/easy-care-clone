import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, DollarSign, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface MonthlyData {
  month: string;
  total: number;
  paid: number;
  pending: number;
}

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))", "hsl(142, 76%, 36%)", "hsl(48, 96%, 53%)"];

export function FinancialRevenueTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalPending: 0,
    totalOverdue: 0,
    totalPaid: 0,
    invoiceCount: 0,
    paidCount: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [methodData, setMethodData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [{ data: invoices }, { data: payments }] = await Promise.all([
        supabase.from("invoices").select("*"),
        supabase.from("payments").select("*").eq("status", "completed"),
      ]);

      const invs = invoices || [];
      const pays = payments || [];

      // Summary stats
      const totalRevenue = pays.reduce((sum, p) => sum + Number(p.amount), 0);
      const totalPending = invs.filter((i) => i.status === "pending").reduce((s, i) => s + Number(i.amount), 0);
      const totalOverdue = invs.filter((i) => i.status === "overdue").reduce((s, i) => s + Number(i.amount), 0);
      const totalPaid = invs.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0);

      setStats({
        totalRevenue,
        totalPending,
        totalOverdue,
        totalPaid,
        invoiceCount: invs.length,
        paidCount: invs.filter((i) => i.status === "paid").length,
      });

      // Monthly revenue (last 6 months)
      const monthMap: Record<string, { total: number; paid: number; pending: number }> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthMap[key] = { total: 0, paid: 0, pending: 0 };
      }

      invs.forEach((inv) => {
        const month = inv.due_date?.substring(0, 7);
        if (month && monthMap[month]) {
          monthMap[month].total += Number(inv.amount);
          if (inv.status === "paid") monthMap[month].paid += Number(inv.amount);
          else monthMap[month].pending += Number(inv.amount);
        }
      });

      setMonthlyData(Object.entries(monthMap).map(([month, data]) => ({
        month: new Date(month + "-01").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        ...data,
      })));

      // Payment methods distribution
      const methodMap: Record<string, number> = {};
      pays.forEach((p) => {
        const method = p.payment_method || "outro";
        methodMap[method] = (methodMap[method] || 0) + Number(p.amount);
      });

      const METHOD_LABELS: Record<string, string> = {
        stripe: "Stripe", mercado_pago: "Mercado Pago", pagseguro: "PagSeguro",
        pix_manual: "PIX", boleto_manual: "Boleto", transferencia: "Transferência",
        dinheiro: "Dinheiro", outro: "Outro",
      };

      setMethodData(Object.entries(methodMap).map(([key, value]) => ({
        name: METHOD_LABELS[key] || key, value,
      })));
    } catch {
      toast({ variant: "destructive", title: "Erro ao carregar relatórios" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Receita Total</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{stats.paidCount} pagamentos recebidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> Faturas Pagas</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {stats.totalPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{stats.paidCount} de {stats.invoiceCount} faturas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4 text-yellow-600" /> Pendente</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">R$ {stats.totalPending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Aguardando pagamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Inadimplência</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">R$ {stats.totalOverdue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Faturas atrasadas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Faturamento Mensal</CardTitle></CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Sem dados suficientes</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                  <Bar dataKey="paid" name="Pago" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="Pendente" fill="hsl(48, 96%, 53%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods Pie */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Métodos de Pagamento</CardTitle></CardHeader>
          <CardContent>
            {methodData.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={methodData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {methodData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
