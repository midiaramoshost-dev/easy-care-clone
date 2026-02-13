import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Search, FileText, CheckCircle, AlertTriangle, XCircle, Clock, Send, Mail, MessageSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface InvoiceRow {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  due_date: string;
  paid_at: string | null;
  description: string | null;
  reference_month: string | null;
  external_id: string | null;
  gateway: string | null;
  created_at: string;
  profile?: { full_name: string | null } | null;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  draft: { label: "Rascunho", variant: "outline", icon: FileText },
  pending: { label: "Pendente", variant: "secondary", icon: Clock },
  paid: { label: "Pago", variant: "default", icon: CheckCircle },
  overdue: { label: "Atrasado", variant: "destructive", icon: AlertTriangle },
  cancelled: { label: "Cancelado", variant: "outline", icon: XCircle },
};

export function FinancialInvoicesTab() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    user_id: "",
    amount: "",
    due_date: "",
    description: "",
    reference_month: "",
    status: "pending" as string,
    sendEmail: false,
    sendWhatsapp: false,
  });
  const [sendingNotif, setSendingNotif] = useState<string | null>(null);

  // Fetch all clients for the dropdown
  const [clients, setClients] = useState<{ id: string; full_name: string | null }[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: invData }, { data: profData }, { data: rolesData }] = await Promise.all([
        supabase.from("invoices").select("*").order("due_date", { ascending: false }),
        supabase.from("profiles").select("id, full_name"),
        supabase.from("user_roles").select("user_id").eq("role", "cliente"),
      ]);

      const profMap: Record<string, string> = {};
      (profData || []).forEach((p) => { profMap[p.id] = p.full_name || "Sem nome"; });
      setProfiles(profMap);

      const clientIds = (rolesData || []).map((r) => r.user_id);
      setClients((profData || []).filter((p) => clientIds.includes(p.id)));

      setInvoices((invData || []).map((inv) => ({ ...inv, profile: profData?.find((p) => p.id === inv.user_id) })));
    } catch {
      toast({ variant: "destructive", title: "Erro ao carregar faturas" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.user_id || !form.amount || !form.due_date) {
      toast({ variant: "destructive", title: "Preencha cliente, valor e vencimento" });
      return;
    }
    setSaving(true);
    try {
      const { data: newInvoice, error } = await supabase.from("invoices").insert({
        user_id: form.user_id,
        amount: parseFloat(form.amount),
        due_date: form.due_date,
        description: form.description || null,
        reference_month: form.reference_month || null,
        status: form.status as any,
      }).select().single();
      if (error) throw error;

      // Send notification if selected
      if (newInvoice && (form.sendEmail || form.sendWhatsapp)) {
        await sendNotification(newInvoice.id, form.sendEmail, form.sendWhatsapp);
      }

      toast({ title: "Fatura criada com sucesso!" });
      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const sendNotification = async (invoiceId: string, email: boolean, whatsapp: boolean) => {
    setSendingNotif(invoiceId);
    try {
      const { data: session } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("send-invoice-notification", {
        body: { invoice_id: invoiceId, channels: { email, whatsapp } },
      });

      if (res.error) {
        toast({ variant: "destructive", title: "Erro ao enviar notificação", description: String(res.error) });
      } else {
        const results = res.data?.results || {};
        const msgs: string[] = [];
        if (results.email?.success) msgs.push("Email enviado");
        if (results.email && !results.email.success) msgs.push(`Email falhou: ${results.email.error}`);
        if (results.whatsapp?.success) msgs.push("WhatsApp enviado");
        if (results.whatsapp && !results.whatsapp.success) msgs.push(`WhatsApp falhou: ${results.whatsapp.error}`);
        toast({ title: "Notificação", description: msgs.join(" | ") || "Enviado" });
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro", description: e.message });
    } finally {
      setSendingNotif(null);
    }
  };

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === "paid") updates.paid_at = new Date().toISOString();
    if (newStatus !== "paid") updates.paid_at = null;

    const { error } = await supabase.from("invoices").update(updates).eq("id", invoiceId);
    if (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar status" });
    } else {
      toast({ title: `Status atualizado para ${STATUS_CONFIG[newStatus]?.label || newStatus}` });
      fetchData();
    }
  };

  const filtered = invoices.filter((inv) => {
    const name = profiles[inv.user_id] || "";
    const matchSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.reference_month?.includes(searchTerm);
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCreate = () => {
    setForm({ user_id: "", amount: "", due_date: "", description: "", reference_month: "", status: "pending", sendEmail: false, sendWhatsapp: false });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente ou descrição..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="overdue">Atrasado</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Nova Fatura</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Ref.</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma fatura encontrada</TableCell></TableRow>
                ) : (
                  filtered.map((inv) => {
                    const sc = STATUS_CONFIG[inv.status] || STATUS_CONFIG.pending;
                    const Icon = sc.icon;
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{profiles[inv.user_id] || "—"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{inv.description || "—"}</TableCell>
                        <TableCell>{inv.reference_month || "—"}</TableCell>
                        <TableCell className="text-right font-mono">R$ {Number(inv.amount).toFixed(2)}</TableCell>
                        <TableCell>{new Date(inv.due_date).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>
                          <Badge variant={sc.variant} className="gap-1">
                            <Icon className="h-3 w-3" /> {sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="flex items-center gap-2">
                          <Select value={inv.status} onValueChange={(v) => handleStatusChange(inv.id, v)}>
                            <SelectTrigger className="w-[130px] h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Rascunho</SelectItem>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="paid">Pago</SelectItem>
                              <SelectItem value="overdue">Atrasado</SelectItem>
                              <SelectItem value="cancelled">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            disabled={sendingNotif === inv.id}
                            onClick={() => sendNotification(inv.id, true, true)}
                            title="Enviar cobrança por Email e WhatsApp"
                          >
                            {sendingNotif === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create Invoice Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Fatura</DialogTitle>
            <DialogDescription>Crie uma fatura para um cliente</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.full_name || "Sem nome"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Vencimento *</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mês de Referência</Label>
                <Input type="month" value={form.reference_month} onChange={(e) => setForm({ ...form, reference_month: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Mensalidade plano Premium - Fev/2026" />
            </div>
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm font-medium">Enviar cobrança ao criar</Label>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sendEmail"
                    checked={form.sendEmail}
                    onCheckedChange={(checked) => setForm({ ...form, sendEmail: checked === true })}
                  />
                  <label htmlFor="sendEmail" className="text-sm flex items-center gap-1 cursor-pointer">
                    <Mail className="h-4 w-4" /> Email
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sendWhatsapp"
                    checked={form.sendWhatsapp}
                    onCheckedChange={(checked) => setForm({ ...form, sendWhatsapp: checked === true })}
                  />
                  <label htmlFor="sendWhatsapp" className="text-sm flex items-center gap-1 cursor-pointer">
                    <MessageSquare className="h-4 w-4" /> WhatsApp
                  </label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Criar Fatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
