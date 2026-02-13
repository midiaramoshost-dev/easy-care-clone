import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Search, DollarSign } from "lucide-react";

const METHOD_LABELS: Record<string, string> = {
  stripe: "Stripe",
  mercado_pago: "Mercado Pago",
  pagseguro: "PagSeguro",
  pix_manual: "PIX (Manual)",
  boleto_manual: "Boleto (Manual)",
  transferencia: "Transferência",
  dinheiro: "Dinheiro",
  outro: "Outro",
};

export function FinancialPaymentsTab() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<{ id: string; full_name: string | null }[]>([]);
  const [invoices, setInvoices] = useState<{ id: string; user_id: string; amount: number; description: string | null; reference_month: string | null }[]>([]);
  const [form, setForm] = useState({
    user_id: "",
    invoice_id: "",
    amount: "",
    payment_method: "pix_manual",
    notes: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: payData }, { data: profData }, { data: rolesData }, { data: invData }] = await Promise.all([
        supabase.from("payments").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, full_name"),
        supabase.from("user_roles").select("user_id").eq("role", "cliente"),
        supabase.from("invoices").select("id, user_id, amount, description, reference_month").eq("status", "pending"),
      ]);

      const profMap: Record<string, string> = {};
      (profData || []).forEach((p) => { profMap[p.id] = p.full_name || "Sem nome"; });
      setProfiles(profMap);

      const clientIds = (rolesData || []).map((r) => r.user_id);
      setClients((profData || []).filter((p) => clientIds.includes(p.id)));
      setInvoices(invData || []);
      setPayments(payData || []);
    } catch {
      toast({ variant: "destructive", title: "Erro ao carregar pagamentos" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredInvoicesForUser = invoices.filter((inv) => inv.user_id === form.user_id);

  const handleCreate = async () => {
    if (!form.user_id || !form.amount) {
      toast({ variant: "destructive", title: "Preencha cliente e valor" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("payments").insert({
        user_id: form.user_id,
        invoice_id: form.invoice_id || null,
        amount: parseFloat(form.amount),
        payment_method: form.payment_method as any,
        notes: form.notes || null,
        received_by: user?.id || null,
        status: "completed",
      });
      if (error) throw error;

      // If linked to invoice, mark as paid
      if (form.invoice_id) {
        await supabase.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", form.invoice_id);
      }

      toast({ title: "Pagamento registrado com sucesso!" });
      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setForm({ user_id: "", invoice_id: "", amount: "", payment_method: "pix_manual", notes: "" });
    setDialogOpen(true);
  };

  const filtered = payments.filter((p) => {
    const name = profiles[p.user_id] || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || p.notes?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Registrar Pagamento</Button>
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
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum pagamento encontrado</TableCell></TableRow>
                ) : (
                  filtered.map((pay) => (
                    <TableRow key={pay.id}>
                      <TableCell className="font-medium">{profiles[pay.user_id] || "—"}</TableCell>
                      <TableCell className="text-right font-mono">R$ {Number(pay.amount).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{METHOD_LABELS[pay.payment_method] || pay.payment_method}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={pay.status === "completed" ? "default" : "destructive"}>
                          {pay.status === "completed" ? "Concluído" : pay.status === "refunded" ? "Reembolsado" : "Falhou"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{pay.notes || "—"}</TableCell>
                      <TableCell>{new Date(pay.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Register Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>Registre um pagamento manual (PIX, dinheiro, transferência, etc.)</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v, invoice_id: "" })}>
                <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.full_name || "Sem nome"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.user_id && filteredInvoicesForUser.length > 0 && (
              <div className="space-y-2">
                <Label>Vincular à Fatura (opcional)</Label>
                <Select value={form.invoice_id} onValueChange={(v) => {
                  const inv = invoices.find((i) => i.id === v);
                  setForm({ ...form, invoice_id: v, amount: inv ? String(inv.amount) : form.amount });
                }}>
                  <SelectTrigger><SelectValue placeholder="Nenhuma fatura" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">Nenhuma</SelectItem>
                    {filteredInvoicesForUser.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>
                        R$ {Number(inv.amount).toFixed(2)} — {inv.description || inv.reference_month || "Sem descrição"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Método de Pagamento</Label>
                <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix_manual">PIX</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="boleto_manual">Boleto</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="mercado_pago">Mercado Pago</SelectItem>
                    <SelectItem value="pagseguro">PagSeguro</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Comprovante PIX, número do boleto, etc." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <DollarSign className="h-4 w-4 mr-2" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
