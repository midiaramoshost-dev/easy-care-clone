import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, AlertTriangle, Clock, CheckCircle2, TrendingDown } from "lucide-react";

type Repasse = {
  id: string;
  institution_id: string;
  amount: number;
  reference_month: string | null;
  status: string;
  created_at: string;
  institutions?: { name: string } | null;
};

type Institution = {
  id: string;
  name: string;
  active: boolean;
};

type AgingBucket = {
  label: string;
  days: string;
  min: number;
  max: number | null;
  colorClass: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
  severity: "low" | "medium" | "high" | "critical";
};

const BUCKETS: AgingBucket[] = [
  { label: "Corrente", days: "0–30 dias", min: 0, max: 30, colorClass: "text-emerald-600", badgeVariant: "default", severity: "low" },
  { label: "Atenção", days: "31–60 dias", min: 31, max: 60, colorClass: "text-amber-600", badgeVariant: "outline", severity: "medium" },
  { label: "Vencido", days: "61–90 dias", min: 61, max: 90, colorClass: "text-orange-600", badgeVariant: "secondary", severity: "high" },
  { label: "Crítico", days: "91+ dias", min: 91, max: null, colorClass: "text-destructive", badgeVariant: "destructive", severity: "critical" },
];

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

function getDaysOld(createdAt: string): number {
  const ms = Date.now() - new Date(createdAt).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function classifyAge(days: number): AgingBucket {
  return BUCKETS.find((b) => days >= b.min && (b.max === null || days <= b.max))!;
}

interface Props {
  repasses: Repasse[];
  institutions: Institution[];
  loading?: boolean;
}

export function DebtAgingTab({ repasses, institutions, loading }: Props) {
  const pending = repasses.filter((r) => r.status === "pending");

  // Per-institution aging breakdown
  const instRows = useMemo(() => {
    const map: Record<string, { name: string; buckets: number[]; total: number; oldest: number }> = {};

    for (const r of pending) {
      if (!map[r.institution_id]) {
        const inst = institutions.find((i) => i.id === r.institution_id);
        map[r.institution_id] = {
          name: inst?.name ?? r.institutions?.name ?? "Desconhecida",
          buckets: [0, 0, 0, 0],
          total: 0,
          oldest: 0,
        };
      }
      const days = getDaysOld(r.created_at);
      const bucketIdx = BUCKETS.findIndex((b) => days >= b.min && (b.max === null || days <= b.max));
      map[r.institution_id].buckets[bucketIdx] += Number(r.amount);
      map[r.institution_id].total += Number(r.amount);
      if (days > map[r.institution_id].oldest) map[r.institution_id].oldest = days;
    }

    return Object.entries(map)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.oldest - a.oldest);
  }, [pending, institutions]);

  // Global totals per bucket
  const globalBuckets = useMemo(
    () => BUCKETS.map((_, idx) => instRows.reduce((s, row) => s + row.buckets[idx], 0)),
    [instRows]
  );
  const globalTotal = globalBuckets.reduce((s, v) => s + v, 0);

  if (loading) {
    return <div className="flex items-center justify-center py-16 text-muted-foreground">Carregando...</div>;
  }

  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
        <CheckCircle2 className="h-10 w-10 text-primary opacity-40" />
        <p className="font-medium">Nenhum repasse pendente!</p>
        <p className="text-sm">Todos os repasses foram liquidados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary KPI buckets */}
      <div className="grid gap-4 md:grid-cols-4">
        {BUCKETS.map((bucket, idx) => {
          const amount = globalBuckets[idx];
          const pct = globalTotal > 0 ? (amount / globalTotal) * 100 : 0;
          const icons = [Clock, Clock, AlertTriangle, TrendingDown];
          const Icon = icons[idx];
          return (
            <Card key={bucket.label} className={amount > 0 && idx >= 2 ? "border-destructive/30" : ""}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {bucket.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${amount > 0 ? bucket.colorClass : "text-muted-foreground"}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${amount > 0 ? bucket.colorClass : "text-muted-foreground"}`}>
                  {fmt(amount)}
                </div>
                <p className="text-xs text-muted-foreground mb-2">{bucket.days}</p>
                {globalTotal > 0 && (
                  <Progress value={pct} className="h-1.5" />
                )}
                {globalTotal > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{pct.toFixed(1)}% do total pendente</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Per-institution breakdown table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Aging por Instituição
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instituição</TableHead>
                {BUCKETS.map((b) => (
                  <TableHead key={b.label} className="text-center">
                    <div>{b.label}</div>
                    <div className="text-xs font-normal text-muted-foreground">{b.days}</div>
                  </TableHead>
                ))}
                <TableHead className="text-right">Total Pendente</TableHead>
                <TableHead className="text-center">Risco</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instRows.map((row) => {
                const riskBucket = classifyAge(row.oldest);
                const riskLabels: Record<string, string> = {
                  low: "Baixo", medium: "Médio", high: "Alto", critical: "Crítico",
                };
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{row.name}</p>
                          <p className="text-xs text-muted-foreground">Mais antigo: {row.oldest}d</p>
                        </div>
                      </div>
                    </TableCell>
                    {row.buckets.map((amt, idx) => (
                      <TableCell key={idx} className="text-center">
                        {amt > 0 ? (
                          <span className={`text-sm font-medium ${BUCKETS[idx].colorClass}`}>
                            {fmt(amt)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-bold text-primary">
                      {fmt(row.total)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={riskBucket.badgeVariant} className="text-xs">
                        {riskLabels[riskBucket.severity]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* Totals row */}
              <TableRow className="bg-muted/30 font-semibold border-t-2">
                <TableCell className="text-sm font-semibold">Total Geral</TableCell>
                {globalBuckets.map((amt, idx) => (
                  <TableCell key={idx} className="text-center">
                    <span className={`text-sm font-semibold ${amt > 0 ? BUCKETS[idx].colorClass : "text-muted-foreground"}`}>
                      {amt > 0 ? fmt(amt) : "—"}
                    </span>
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold text-primary">
                  {fmt(globalTotal)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="font-medium">Legenda:</span>
        {BUCKETS.map((b) => (
          <span key={b.label} className={`flex items-center gap-1 ${b.colorClass}`}>
            <span className="w-2 h-2 rounded-full bg-current inline-block" />
            {b.label} ({b.days})
          </span>
        ))}
        <span className="ml-2">· Aging calculado pela data de criação do repasse.</span>
      </div>
    </div>
  );
}
