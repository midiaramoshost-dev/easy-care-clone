import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Building2, Plus, RefreshCw, Edit, Phone, Mail, MapPin,
  CreditCard, Users, CheckCircle2, XCircle, Search, Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────────────
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
  amount: number;
  reference_month: string | null;
  notes: string | null;
  status: string;
  paid_at: string | null;
  created_at: string;
};

// ── Validation schema ──────────────────────────────────────────────────────────
const institutionSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres").max(150, "Máximo 150 caracteres"),
  cnpj: z
    .string()
    .trim()
    .max(18, "CNPJ inválido")
    .regex(/^(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{14}|)$/, "CNPJ inválido (formato: 00.000.000/0001-00)")
    .optional()
    .or(z.literal("")),
  email: z.string().trim().email("E-mail inválido").max(255).optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .max(20, "Telefone inválido")
    .regex(/^[\d\s\(\)\-\+]*$/, "Apenas dígitos, espaços e símbolos ( ) - +")
    .optional()
    .or(z.literal("")),
  address: z.string().trim().max(300, "Máximo 300 caracteres").optional().or(z.literal("")),
  contact_person: z.string().trim().max(100, "Máximo 100 caracteres").optional().or(z.literal("")),
  pix_key: z.string().trim().max(150, "Máximo 150 caracteres").optional().or(z.literal("")),
  bank_info: z.string().trim().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
});

type InstitutionFormValues = z.infer<typeof institutionSchema>;

// ── Status config ──────────────────────────────────────────────────────────────
const repasseStatus: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "secondary" },
  paid: { label: "Pago", variant: "default" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

// ── Component ──────────────────────────────────────────────────────────────────
export function AdminInstitutions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Institution | null>(null);
  const [detailInst, setDetailInst] = useState<Institution | null>(null);

  // ── Form ────────────────────────────────────────────────────────────────────
  const form = useForm<InstitutionFormValues>({
    resolver: zodResolver(institutionSchema),
    defaultValues: {
      name: "", cnpj: "", email: "", phone: "", address: "",
      contact_person: "", pix_key: "", bank_info: "",
    },
  });

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: institutions = [], isLoading, refetch } = useQuery({
    queryKey: ["institutions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institutions")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Institution[];
    },
  });

  const { data: repassesByInst = {} } = useQuery({
    queryKey: ["repasses-by-institution"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("repasses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Repasse[]).reduce<Record<string, Repasse[]>>((acc, r) => {
        const instId = (r as Repasse & { institution_id: string }).institution_id;
        if (!acc[instId]) acc[instId] = [];
        acc[instId].push(r);
        return acc;
      }, {});
    },
  });

  const detailRepasses: (Repasse & { institution_id: string })[] =
    detailInst ? ((repassesByInst as Record<string, (Repasse & { institution_id: string })[]>)[detailInst.id] || []) : [];

  const detailTotal = detailRepasses.filter((r) => r.status === "paid").reduce((s, r) => s + Number(r.amount), 0);

  // ── Mutations ────────────────────────────────────────────────────────────────
  const save = useMutation({
    mutationFn: async (values: InstitutionFormValues) => {
      const payload = {
        name: values.name,
        cnpj: values.cnpj || null,
        email: values.email || null,
        phone: values.phone || null,
        address: values.address || null,
        contact_person: values.contact_person || null,
        pix_key: values.pix_key || null,
        bank_info: values.bank_info || null,
      };
      if (editTarget) {
        const { error } = await supabase.from("institutions").update(payload).eq("id", editTarget.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("institutions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editTarget ? "Instituição atualizada!" : "Instituição cadastrada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      closeDialog();
    },
    onError: (e: Error) => toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("institutions").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { active }) => {
      toast({ title: active ? "Instituição ativada." : "Instituição desativada." });
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      if (detailInst) setDetailInst((prev) => prev ? { ...prev, active } : prev);
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    form.reset({ name: "", cnpj: "", email: "", phone: "", address: "", contact_person: "", pix_key: "", bank_info: "" });
    setDialogOpen(true);
  };

  const openEdit = (inst: Institution) => {
    setEditTarget(inst);
    form.reset({
      name: inst.name,
      cnpj: inst.cnpj ?? "",
      email: inst.email ?? "",
      phone: inst.phone ?? "",
      address: inst.address ?? "",
      contact_person: inst.contact_person ?? "",
      pix_key: inst.pix_key ?? "",
      bank_info: inst.bank_info ?? "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditTarget(null);
    form.reset();
  };

  const filtered = institutions.filter((i) =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.cnpj ?? "").includes(search) || (i.contact_person ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // KPIs
  const total = institutions.length;
  const active = institutions.filter((i) => i.active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Instituições</h2>
          <p className="text-muted-foreground">Cadastro de asilos e entidades beneficiárias de Sorocaba</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />Atualizar
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />Nova Instituição
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cadastradas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">Instituições registradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ativas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{active}</div>
            <p className="text-xs text-muted-foreground">Aptas a receber repasses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inativas</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total - active}</div>
            <p className="text-xs text-muted-foreground">Desativadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, CNPJ ou responsável..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Building2 className="h-8 w-8 opacity-30" />
              <p>{search ? "Nenhuma instituição encontrada." : "Nenhuma instituição cadastrada."}</p>
              {!search && (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />Cadastrar primeira instituição
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instituição</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>PIX</TableHead>
                  <TableHead>Repasses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inst) => {
                  const instRepasses = (repassesByInst as Record<string, Repasse[]>)[inst.id] || [];
                  const paidTotal = instRepasses.filter((r) => r.status === "paid").reduce((s, r) => s + Number(r.amount), 0);
                  return (
                    <TableRow
                      key={inst.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setDetailInst(inst)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{inst.name}</p>
                            {inst.cnpj && <p className="text-xs text-muted-foreground">{inst.cnpj}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{inst.contact_person || "—"}</p>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          {inst.email && <p className="text-xs text-muted-foreground">{inst.email}</p>}
                          {inst.phone && <p className="text-xs text-muted-foreground">{inst.phone}</p>}
                          {!inst.email && !inst.phone && <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-mono">{inst.pix_key || "—"}</p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-bold text-primary">
                            R$ {paidTotal.toFixed(2).replace(".", ",")}
                          </p>
                          <p className="text-xs text-muted-foreground">{instRepasses.length} repasse(s)</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={inst.active ? "default" : "secondary"}>
                          {inst.active ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openEdit(inst)}>
                            <Edit className="h-3 w-3 mr-1" />Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => toggleActive.mutate({ id: inst.id, active: !inst.active })}
                            disabled={toggleActive.isPending}
                          >
                            {inst.active ? "Desativar" : "Ativar"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Detail Sheet ──────────────────────────────────────────────────────── */}
      <Sheet open={!!detailInst} onOpenChange={(open) => !open && setDetailInst(null)}>
        <SheetContent className="sm:max-w-[500px] overflow-y-auto">
          {detailInst && (
            <>
              <SheetHeader className="mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <SheetTitle className="text-left">{detailInst.name}</SheetTitle>
                    <SheetDescription className="text-left">{detailInst.cnpj || "Sem CNPJ cadastrado"}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              {/* Status badge */}
              <div className="flex items-center gap-2 mb-4">
                <Badge variant={detailInst.active ? "default" : "secondary"}>
                  {detailInst.active ? "Ativa" : "Inativa"}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs"
                  onClick={() => toggleActive.mutate({ id: detailInst.id, active: !detailInst.active })}
                >
                  {detailInst.active ? "Desativar" : "Ativar"}
                </Button>
                <Button size="sm" variant="outline" className="h-6 text-xs ml-auto" onClick={() => { setDetailInst(null); openEdit(detailInst); }}>
                  <Edit className="h-3 w-3 mr-1" />Editar
                </Button>
              </div>

              {/* Total repassed KPI */}
              <div className="rounded-lg border p-4 mb-4 bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Total repassado (confirmado)</p>
                <p className="text-2xl font-bold text-primary">R$ {detailTotal.toFixed(2).replace(".", ",")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{detailRepasses.length} repasse(s) no total</p>
              </div>

              {/* Contact info */}
              <div className="space-y-2 mb-4">
                {detailInst.contact_person && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{detailInst.contact_person}</span>
                  </div>
                )}
                {detailInst.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${detailInst.email}`} className="text-primary hover:underline">{detailInst.email}</a>
                  </div>
                )}
                {detailInst.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{detailInst.phone}</span>
                  </div>
                )}
                {detailInst.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{detailInst.address}</span>
                  </div>
                )}
              </div>

              {/* Banking / PIX */}
              {(detailInst.pix_key || detailInst.bank_info) && (
                <>
                  <Separator className="mb-3" />
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />Dados Bancários / PIX
                  </h3>
                  {detailInst.pix_key && (
                    <div className="rounded border px-3 py-2 mb-2 bg-muted/40">
                      <p className="text-xs text-muted-foreground mb-0.5">Chave PIX</p>
                      <p className="text-sm font-mono">{detailInst.pix_key}</p>
                    </div>
                  )}
                  {detailInst.bank_info && (
                    <div className="rounded border px-3 py-2 mb-4 bg-muted/40">
                      <p className="text-xs text-muted-foreground mb-0.5">Dados Bancários</p>
                      <p className="text-sm whitespace-pre-wrap">{detailInst.bank_info}</p>
                    </div>
                  )}
                </>
              )}

              {/* Repasse history */}
              <Separator className="mb-3" />
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Send className="h-4 w-4" />Histórico de Repasses
              </h3>
              {detailRepasses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum repasse realizado ainda.</p>
              ) : (
                <div className="space-y-2">
                  {detailRepasses.map((r) => {
                    const st = repasseStatus[r.status] || { label: r.status, variant: "outline" as const };
                    return (
                      <div key={r.id} className="rounded-lg border p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary">R$ {Number(r.amount).toFixed(2).replace(".", ",")}</span>
                          <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                        </div>
                        {r.reference_month && (
                          <p className="text-xs text-muted-foreground">Ref.: {r.reference_month}</p>
                        )}
                        {r.notes && <p className="text-xs text-muted-foreground italic">"{r.notes}"</p>}
                        <p className="text-xs text-muted-foreground">
                          Criado: {new Date(r.created_at).toLocaleDateString("pt-BR")}
                          {r.paid_at && ` · Pago: ${new Date(r.paid_at).toLocaleDateString("pt-BR")}`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Create / Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Editar Instituição" : "Nova Instituição"}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4 py-2">

              {/* Basic info */}
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Instituição *</FormLabel>
                  <FormControl><Input placeholder="Ex: Asilo São Francisco" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="cnpj" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl><Input placeholder="00.000.000/0001-00" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl><Input placeholder="(15) 99999-9999" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl><Input type="email" placeholder="contato@asilo.org.br" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="contact_person" render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável / Contato</FormLabel>
                  <FormControl><Input placeholder="Nome do responsável" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl><Input placeholder="Rua, número, bairro, cidade" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Separator />
              <p className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4" />Dados para Repasse
              </p>

              <FormField control={form.control} name="pix_key" render={({ field }) => (
                <FormItem>
                  <FormLabel>Chave PIX</FormLabel>
                  <FormControl><Input placeholder="CNPJ, e-mail, telefone ou chave aleatória" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="bank_info" render={({ field }) => (
                <FormItem>
                  <FormLabel>Dados Bancários</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={"Banco: Bradesco\nAgência: 1234-5\nConta corrente: 123456-7"}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending ? "Salvando..." : editTarget ? "Salvar Alterações" : "Cadastrar Instituição"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminInstitutions;
