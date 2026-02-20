import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Building2, Plus, Send, CheckCircle2, Clock, RefreshCw, Edit, DollarSign, TrendingUp,
  Download, Filter, X, BarChart3,
} from "lucide-react";
import { DebtAgingTab } from "./DebtAgingTab";
import { useToast } from "@/hooks/use-toast";

type Institution = {
  id: string;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  contact_person: string | null;
  pix_key: string | null;
  bank_info: string | null;
  active: boolean;
  created_at: string;
};

type Repasse = {
  id: string;
  institution_id: string;
  amount: number;
  reference_month: string | null;
  notes: string | null;
  status: string;
  paid_at: string | null;
  created_at: string;
  institutions?: { name: string } | null;
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  pending: { label: "Pendente", variant: "secondary", icon: Clock },
  paid: { label: "Pago", variant: "default", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", variant: "destructive", icon: Clock },
};

const EMPTY_INSTITUTION = { name: "", cnpj: "", email: "", phone: "", address: "", contact_person: "", pix_key: "", bank_info: "" };
const EMPTY_REPASSE = { institution_id: "", amount: "", reference_month: "", notes: "" };

export function AdminRepasses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState("repasses");
  const [addRepasseOpen, setAddRepasseOpen] = useState(false);
  const [addInstOpen, setAddInstOpen] = useState(false);
  const [editInst, setEditInst] = useState<Institution | null>(null);
  const [instForm, setInstForm] = useState(EMPTY_INSTITUTION);
  const [repasseForm, setRepasseForm] = useState(EMPTY_REPASSE);
  const [selectedRepasse, setSelectedRepasse] = useState<Repasse | null>(null);

  // Filters
  const [filterInst, setFilterInst] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const hasActiveFilters = filterInst !== "all" || filterStatus !== "all" || !!filterDateFrom || !!filterDateTo;

  const clearFilters = () => {
    setFilterInst("all");
    setFilterStatus("all");
    setFilterDateFrom("");
    setFilterDateTo("");
  };


  // Queries
  const { data: institutions = [], isLoading: loadingInst, refetch: refetchInst } = useQuery({
    queryKey: ["institutions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("institutions").select("*").order("name");
      if (error) throw error;
      return data as Institution[];
    },
  });

  const { data: repasses = [], isLoading: loadingRepasses, refetch: refetchRepasses } = useQuery({
    queryKey: ["repasses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("repasses")
        .select("*, institutions(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Repasse[];
    },
  });

  const { data: donations = [] } = useQuery({
    queryKey: ["admin-donations-summary"],
    queryFn: async () => {
      const { data, error } = await supabase.from("donations").select("amount, status");
      if (error) throw error;
      return data;
    },
  });

  // KPIs (always from full repasses list)
  const totalReceived = donations.reduce((s, d) => d.status === "paid" ? s + Number(d.amount) : s, 0);
  const totalRepassed = repasses.reduce((s, r) => r.status === "paid" ? s + Number(r.amount) : s, 0);
  const pendingRepassesAmt = repasses.filter((r) => r.status === "pending").reduce((s, r) => s + Number(r.amount), 0);
  const balance = totalReceived - totalRepassed;

  // Filtered list for table
  const filteredRepasses = repasses.filter((r) => {
    if (filterInst !== "all" && r.institution_id !== filterInst) return false;
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterDateFrom && r.created_at < filterDateFrom) return false;
    if (filterDateTo && r.created_at > filterDateTo + "T23:59:59") return false;
    return true;
  });

  // CSV export
  const handleExportCSV = () => {
    if (filteredRepasses.length === 0) return;
    const headers = ["Instituição", "Valor (R$)", "Mês Referência", "Status", "Observações", "Criado em", "Pago em"];
    const rows = filteredRepasses.map((r) => [
      `"${(r.institutions?.name || "").replace(/"/g, '""')}"`,
      Number(r.amount).toFixed(2),
      `"${r.reference_month || ""}"`,
      statusConfig[r.status]?.label || r.status,
      `"${(r.notes || "").replace(/"/g, '""')}"`,
      new Date(r.created_at).toLocaleString("pt-BR"),
      r.paid_at ? new Date(r.paid_at).toLocaleString("pt-BR") : "",
    ]);
    const csv = [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `repasses_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `${filteredRepasses.length} repasse(s) exportados!` });
  };



  // Mutations
  const saveInstitution = useMutation({
    mutationFn: async (data: typeof instForm & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase.from("institutions").update({ ...data }).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("institutions").insert({ ...data });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editInst ? "Instituição atualizada!" : "Instituição cadastrada!" });
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      setAddInstOpen(false);
      setEditInst(null);
      setInstForm(EMPTY_INSTITUTION);
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const toggleInstActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("institutions").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["institutions"] }); },
  });

  const createRepasse = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("repasses").insert({
        institution_id: repasseForm.institution_id,
        amount: Number(repasseForm.amount),
        reference_month: repasseForm.reference_month || null,
        notes: repasseForm.notes || null,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Repasse criado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["repasses"] });
      setAddRepasseOpen(false);
      setRepasseForm(EMPTY_REPASSE);
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const markRepasse = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const update: Record<string, unknown> = { status };
      if (status === "paid") update.paid_at = new Date().toISOString();
      const { error } = await supabase.from("repasses").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      toast({ title: status === "paid" ? "Repasse confirmado como pago!" : "Repasse cancelado." });
      queryClient.invalidateQueries({ queryKey: ["repasses"] });
      setSelectedRepasse(null);
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const openEditInst = (inst: Institution) => {
    setEditInst(inst);
    setInstForm({
      name: inst.name,
      cnpj: inst.cnpj || "",
      email: inst.email || "",
      phone: inst.phone || "",
      address: inst.address || "",
      contact_person: inst.contact_person || "",
      pix_key: inst.pix_key || "",
      bank_info: inst.bank_info || "",
    });
    setAddInstOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Repasses</h2>
          <p className="text-muted-foreground">Gestão de transferências para instituições beneficiárias</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { refetchInst(); refetchRepasses(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />Atualizar
          </Button>
          <Button size="sm" onClick={() => { setAddRepasseOpen(true); }}>
            <Send className="h-4 w-4 mr-2" />Novo Repasse
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Recebido", value: `R$ ${totalReceived.toFixed(2).replace(".", ",")}`, sub: "Doações confirmadas", icon: DollarSign, colored: true },
          { label: "Total Repassado", value: `R$ ${totalRepassed.toFixed(2).replace(".", ",")}`, sub: "Transferências pagas", icon: CheckCircle2 },
          { label: "A Repassar", value: `R$ ${pendingRepassesAmt.toFixed(2).replace(".", ",")}`, sub: "Repasses pendentes", icon: Clock },
          { label: "Saldo Disponível", value: `R$ ${balance.toFixed(2).replace(".", ",")}`, sub: "Para novos repasses", icon: TrendingUp, colored: balance > 0 },
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

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="repasses">Repasses</TabsTrigger>
          <TabsTrigger value="instituicoes">Instituições</TabsTrigger>
          <TabsTrigger value="aging" className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />Aging de Dívidas
          </TabsTrigger>
        </TabsList>

        {/* Repasses Tab */}
        <TabsContent value="repasses" className="mt-4 space-y-3">
          {/* Filters bar */}
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

            <Select value={filterInst} onValueChange={setFilterInst}>
              <SelectTrigger className="w-[200px] bg-background">
                <SelectValue placeholder="Instituição" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">Todas as instituições</SelectItem>
                {institutions.map((i) => (
                  <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px] bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">De:</Label>
              <Input
                type="date"
                className="w-[140px] h-9 text-sm bg-background"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Até:</Label>
              <Input
                type="date"
                className="w-[140px] h-9 text-sm bg-background"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-9 px-2 text-muted-foreground" onClick={clearFilters}>
                <X className="h-3.5 w-3.5 mr-1" />Limpar
              </Button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {filteredRepasses.length} resultado(s)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={filteredRepasses.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />Exportar CSV
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {loadingRepasses ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">Carregando...</div>
              ) : filteredRepasses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                  <Send className="h-8 w-8 opacity-30" />
                  <p>{hasActiveFilters ? "Nenhum repasse para os filtros selecionados." : "Nenhum repasse registrado."}</p>
                  {!hasActiveFilters && (
                    <Button size="sm" onClick={() => setAddRepasseOpen(true)}><Plus className="h-4 w-4 mr-2" />Criar primeiro repasse</Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instituição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Mês Ref.</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRepasses.map((r) => {
                      const st = statusConfig[r.status] || { label: r.status, variant: "outline" as const, icon: Clock };
                      const Icon = st.icon;
                      return (
                        <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedRepasse(r)}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm">{r.institutions?.name || "—"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-primary">R$ {Number(r.amount).toFixed(2).replace(".", ",")}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{r.reference_month || "—"}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={st.variant} className="flex items-center gap-1 w-fit">
                              <Icon className="h-3 w-3" />{st.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {new Date(r.created_at).toLocaleDateString("pt-BR")}
                            </span>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            {r.status === "pending" && (
                              <div className="flex gap-1 justify-end">
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => markRepasse.mutate({ id: r.id, status: "paid" })}>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />Confirmar
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => markRepasse.mutate({ id: r.id, status: "cancelled" })}>
                                  Cancelar
                                </Button>
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
        </TabsContent>

        {/* Aging Tab */}
        <TabsContent value="aging" className="mt-4">
          <DebtAgingTab
            repasses={repasses}
            institutions={institutions}
            loading={loadingRepasses || loadingInst}
          />
        </TabsContent>

        {/* Institutions Tab */}
        <TabsContent value="instituicoes" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => { setEditInst(null); setInstForm(EMPTY_INSTITUTION); setAddInstOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />Nova Instituição
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {loadingInst ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">Carregando...</div>
              ) : institutions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                  <Building2 className="h-8 w-8 opacity-30" />
                  <p>Nenhuma instituição cadastrada.</p>
                  <Button size="sm" onClick={() => { setEditInst(null); setInstForm(EMPTY_INSTITUTION); setAddInstOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />Cadastrar instituição
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>PIX</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {institutions.map((inst) => (
                      <TableRow key={inst.id}>
                        <TableCell>
                          <p className="font-medium text-sm">{inst.name}</p>
                          {inst.cnpj && <p className="text-xs text-muted-foreground">{inst.cnpj}</p>}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{inst.contact_person || "—"}</p>
                          <p className="text-xs text-muted-foreground">{inst.email || inst.phone || ""}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-mono text-xs">{inst.pix_key || "—"}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={inst.active ? "default" : "secondary"}>
                            {inst.active ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openEditInst(inst)}>
                              <Edit className="h-3 w-3 mr-1" />Editar
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toggleInstActive.mutate({ id: inst.id, active: !inst.active })}>
                              {inst.active ? "Desativar" : "Ativar"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Novo Repasse */}
      <Dialog open={addRepasseOpen} onOpenChange={setAddRepasseOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Novo Repasse</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Instituição *</Label>
              <Select value={repasseForm.institution_id} onValueChange={(v) => setRepasseForm((f) => ({ ...f, institution_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione a instituição" /></SelectTrigger>
                <SelectContent>
                  {institutions.filter((i) => i.active).map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Valor (R$) *</Label>
                <Input type="number" min="0.01" step="0.01" placeholder="0,00" value={repasseForm.amount} onChange={(e) => setRepasseForm((f) => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Mês Referência</Label>
                <Input placeholder="ex: 02/2026" value={repasseForm.reference_month} onChange={(e) => setRepasseForm((f) => ({ ...f, reference_month: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Observações</Label>
              <Textarea placeholder="Detalhes do repasse..." value={repasseForm.notes} onChange={(e) => setRepasseForm((f) => ({ ...f, notes: e.target.value }))} rows={3} />
            </div>
            {balance > 0 && (
              <p className="text-xs text-muted-foreground bg-muted rounded px-3 py-2">
                💰 Saldo disponível: <span className="font-semibold text-primary">R$ {balance.toFixed(2).replace(".", ",")}</span>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRepasseOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => createRepasse.mutate()}
              disabled={!repasseForm.institution_id || !repasseForm.amount || createRepasse.isPending}
            >
              <Send className="h-4 w-4 mr-2" />{createRepasse.isPending ? "Salvando..." : "Criar Repasse"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Instituição */}
      <Dialog open={addInstOpen} onOpenChange={(open) => { setAddInstOpen(open); if (!open) { setEditInst(null); setInstForm(EMPTY_INSTITUTION); } }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editInst ? "Editar Instituição" : "Nova Instituição"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input value={instForm.name} onChange={(e) => setInstForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nome da instituição" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>CNPJ</Label>
                <Input value={instForm.cnpj} onChange={(e) => setInstForm((f) => ({ ...f, cnpj: e.target.value }))} placeholder="00.000.000/0001-00" />
              </div>
              <div className="space-y-1">
                <Label>Telefone</Label>
                <Input value={instForm.phone} onChange={(e) => setInstForm((f) => ({ ...f, phone: e.target.value }))} placeholder="(15) 99999-9999" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>E-mail</Label>
              <Input type="email" value={instForm.email} onChange={(e) => setInstForm((f) => ({ ...f, email: e.target.value }))} placeholder="contato@asilo.org.br" />
            </div>
            <div className="space-y-1">
              <Label>Responsável / Contato</Label>
              <Input value={instForm.contact_person} onChange={(e) => setInstForm((f) => ({ ...f, contact_person: e.target.value }))} placeholder="Nome do responsável" />
            </div>
            <Separator />
            <div className="space-y-1">
              <Label>Chave PIX</Label>
              <Input value={instForm.pix_key} onChange={(e) => setInstForm((f) => ({ ...f, pix_key: e.target.value }))} placeholder="CNPJ, e-mail ou chave aleatória" />
            </div>
            <div className="space-y-1">
              <Label>Dados Bancários</Label>
              <Textarea value={instForm.bank_info} onChange={(e) => setInstForm((f) => ({ ...f, bank_info: e.target.value }))} placeholder="Banco, Agência, Conta..." rows={2} />
            </div>
            <div className="space-y-1">
              <Label>Endereço</Label>
              <Input value={instForm.address} onChange={(e) => setInstForm((f) => ({ ...f, address: e.target.value }))} placeholder="Endereço completo" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddInstOpen(false); setEditInst(null); setInstForm(EMPTY_INSTITUTION); }}>Cancelar</Button>
            <Button
              onClick={() => saveInstitution.mutate(editInst ? { ...instForm, id: editInst.id } : instForm)}
              disabled={!instForm.name || saveInstitution.isPending}
            >
              {saveInstitution.isPending ? "Salvando..." : editInst ? "Salvar Alterações" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet: Repasse */}
      <Sheet open={!!selectedRepasse} onOpenChange={(open) => !open && setSelectedRepasse(null)}>
        <SheetContent className="sm:max-w-[420px] overflow-y-auto">
          {selectedRepasse && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle>Detalhes do Repasse</SheetTitle>
              </SheetHeader>
              <div className="space-y-4">
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Instituição</span>
                    <span className="font-medium text-sm">{selectedRepasse.institutions?.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Valor</span>
                    <span className="font-bold text-primary text-lg">R$ {Number(selectedRepasse.amount).toFixed(2).replace(".", ",")}</span>
                  </div>
                  {selectedRepasse.reference_month && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">Mês Referência</span>
                      <span className="text-sm">{selectedRepasse.reference_month}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Status</span>
                    <Badge variant={statusConfig[selectedRepasse.status]?.variant || "outline"}>
                      {statusConfig[selectedRepasse.status]?.label || selectedRepasse.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Criado em</span>
                    <span className="text-sm">{new Date(selectedRepasse.created_at).toLocaleString("pt-BR")}</span>
                  </div>
                  {selectedRepasse.paid_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">Pago em</span>
                      <span className="text-sm text-primary font-medium">{new Date(selectedRepasse.paid_at).toLocaleString("pt-BR")}</span>
                    </div>
                  )}
                  {selectedRepasse.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Observações</p>
                      <p className="text-sm italic">"{selectedRepasse.notes}"</p>
                    </div>
                  )}
                </div>

                {selectedRepasse.status === "pending" && (
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => markRepasse.mutate({ id: selectedRepasse.id, status: "paid" })} disabled={markRepasse.isPending}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />Confirmar Pagamento
                    </Button>
                    <Button variant="outline" className="flex-1 text-destructive hover:text-destructive" onClick={() => markRepasse.mutate({ id: selectedRepasse.id, status: "cancelled" })} disabled={markRepasse.isPending}>
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default AdminRepasses;
