import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Pill, Plus, Trash2, Edit, Clock, Calendar, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function MedicationsTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedElderly, setSelectedElderly] = useState<string>("");
  const [showInactive, setShowInactive] = useState(false);
  const [form, setForm] = useState({
    name: "", dosage: "", frequency: "", notes: "", elderly_id: "",
    start_date: "", end_date: "",
  });

  const { data: elderlyList = [] } = useQuery({
    queryKey: ["elderly", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("elderly").select("id, name").eq("responsible_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: medications = [], isLoading } = useQuery({
    queryKey: ["medications", user?.id, selectedElderly],
    queryFn: async () => {
      let query = supabase.from("medications").select("*, elderly!inner(name, responsible_id)");
      if (selectedElderly) query = query.eq("elderly_id", selectedElderly);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data.filter((m: any) => m.elderly?.responsible_id === user!.id);
    },
    enabled: !!user,
  });

  const upsertMed = useMutation({
    mutationFn: async () => {
      const payload = {
        elderly_id: form.elderly_id,
        name: form.name,
        dosage: form.dosage || null,
        frequency: form.frequency || null,
        notes: form.notes || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      };
      if (editingId) {
        const { error } = await supabase.from("medications").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("medications").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      toast.success(editingId ? "Medicamento atualizado!" : "Medicamento adicionado!");
      resetForm();
    },
    onError: () => toast.error("Erro ao salvar medicamento."),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("medications").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      toast.success("Status atualizado.");
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("medications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      toast.success("Medicamento removido.");
    },
  });

  const resetForm = () => {
    setForm({ name: "", dosage: "", frequency: "", notes: "", elderly_id: "", start_date: "", end_date: "" });
    setEditingId(null);
    setDialogOpen(false);
  };

  const startEdit = (m: any) => {
    setForm({
      name: m.name, dosage: m.dosage || "", frequency: m.frequency || "",
      notes: m.notes || "", elderly_id: m.elderly_id, start_date: m.start_date || "", end_date: m.end_date || "",
    });
    setEditingId(m.id);
    setDialogOpen(true);
  };

  const filtered = medications.filter((m: any) => showInactive || m.active);
  const activeCount = medications.filter((m: any) => m.active).length;
  const inactiveCount = medications.filter((m: any) => !m.active).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <div>
          <CardTitle className="flex items-center gap-2"><Pill className="w-5 h-5 text-primary" /> Medicamentos</CardTitle>
          <CardDescription>
            {activeCount} ativo{activeCount !== 1 ? "s" : ""}
            {inactiveCount > 0 && ` · ${inactiveCount} inativo${inactiveCount !== 1 ? "s" : ""}`}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {inactiveCount > 0 && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <Switch checked={showInactive} onCheckedChange={setShowInactive} />
              Inativos
            </label>
          )}
          <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={elderlyList.length === 0}><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-primary" />
                  {editingId ? "Editar Medicamento" : "Novo Medicamento"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Idoso *</Label>
                  <Select value={form.elderly_id} onValueChange={(v) => setForm({ ...form, elderly_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione o idoso" /></SelectTrigger>
                    <SelectContent>
                      {elderlyList.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div>
                  <Label>Nome do Medicamento *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Losartana" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Dosagem</Label>
                    <Input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} placeholder="Ex: 50mg" />
                  </div>
                  <div>
                    <Label>Frequência</Label>
                    <Input value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} placeholder="Ex: 2x ao dia" />
                  </div>
                </div>
                <Separator />
                <p className="text-sm font-medium text-muted-foreground">Período de Uso</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Início</Label>
                    <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                  </div>
                  <div>
                    <Label>Fim (opcional)</Label>
                    <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ex: Tomar em jejum, efeitos colaterais..." rows={3} />
                </div>
                <Button className="w-full" disabled={!form.name || !form.elderly_id} onClick={() => upsertMed.mutate()}>
                  {editingId ? "Salvar Alterações" : "Adicionar Medicamento"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {elderlyList.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <AlertCircle className="w-10 h-10 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">Cadastre um idoso primeiro para adicionar medicamentos.</p>
          </div>
        ) : (
          <>
            {elderlyList.length > 1 && (
              <div className="mb-4">
                <Select value={selectedElderly} onValueChange={setSelectedElderly}>
                  <SelectTrigger><SelectValue placeholder="Filtrar por idoso" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {elderlyList.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {isLoading ? <p className="text-muted-foreground text-center py-8">Carregando...</p> :
             filtered.length === 0 ? <p className="text-muted-foreground text-center py-8">Nenhum medicamento encontrado.</p> : (
              <div className="space-y-3">
                {filtered.map((m: any) => (
                  <div key={m.id} className={`rounded-xl border p-4 transition-colors ${m.active ? 'bg-card' : 'bg-muted/30 opacity-70'}`}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Pill className={`w-4 h-4 ${m.active ? 'text-primary' : 'text-muted-foreground'}`} />
                          <h4 className="font-semibold">{m.name}</h4>
                          <Badge variant={m.active ? "default" : "secondary"}>
                            {m.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{m.elderly?.name}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          {m.dosage && <span className="font-medium text-foreground/80">💊 {m.dosage}</span>}
                          {m.frequency && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {m.frequency}
                            </span>
                          )}
                        </div>
                        {(m.start_date || m.end_date) && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            {m.start_date && new Date(m.start_date + "T00:00:00").toLocaleDateString("pt-BR")}
                            {m.start_date && m.end_date && " → "}
                            {m.end_date && new Date(m.end_date + "T00:00:00").toLocaleDateString("pt-BR")}
                            {m.start_date && !m.end_date && " → uso contínuo"}
                          </div>
                        )}
                        {m.notes && <p className="text-xs text-muted-foreground mt-1 italic">{m.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Switch checked={m.active} onCheckedChange={(v) => toggleActive.mutate({ id: m.id, active: v })} />
                        <Button size="sm" variant="ghost" onClick={() => startEdit(m)}><Edit className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => remove.mutate(m.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
