import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Activity, Plus, Edit, Trash2, Heart, Thermometer, Droplets, Weight, Gauge } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

function VitalCard({ icon: Icon, label, value, unit, color }: { icon: any; label: string; value: string | number; unit: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${color}`}>
      <Icon className="w-4 h-4 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}<span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span></p>
      </div>
    </div>
  );
}

export function CaregiverHealthTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedElderly, setSelectedElderly] = useState<string>("");
  const [form, setForm] = useState({
    elderly_id: "", blood_pressure: "", temperature: "", blood_sugar: "", weight: "", heart_rate: "", notes: "",
  });

  const { data: elderlyList = [] } = useQuery({
    queryKey: ["caregiver-elderly", user?.id],
    queryFn: async () => {
      const { data: appointments } = await supabase.from("appointments").select("client_id").eq("caregiver_id", user!.id).in("status", ["pending", "confirmed", "in_progress"]);
      const clientIds = [...new Set((appointments || []).map((a) => a.client_id))];
      if (clientIds.length === 0) return [];
      const { data, error } = await supabase.from("elderly").select("id, name").in("responsible_id", clientIds);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["health-records-caregiver", user?.id, selectedElderly],
    queryFn: async () => {
      const elderlyIds = elderlyList.map((e: any) => e.id);
      if (elderlyIds.length === 0) return [];
      let query = supabase.from("health_records").select("*, elderly(name)").order("recorded_at", { ascending: false });
      if (selectedElderly) {
        query = query.eq("elderly_id", selectedElderly);
      } else {
        query = query.in("elderly_id", elderlyIds);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user && elderlyList.length > 0,
  });

  const upsertRecord = useMutation({
    mutationFn: async () => {
      const payload = {
        elderly_id: form.elderly_id,
        recorded_by: user!.id,
        blood_pressure: form.blood_pressure || null,
        temperature: form.temperature ? parseFloat(form.temperature) : null,
        blood_sugar: form.blood_sugar ? parseFloat(form.blood_sugar) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        heart_rate: form.heart_rate ? parseInt(form.heart_rate) : null,
        notes: form.notes || null,
      };
      if (editingId) {
        const { error } = await supabase.from("health_records").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("health_records").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-records-caregiver"] });
      toast.success(editingId ? "Registro atualizado!" : "Registro de saúde salvo!");
      resetForm();
    },
    onError: () => toast.error("Erro ao salvar registro."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("health_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-records-caregiver"] });
      toast.success("Registro removido.");
    },
  });

  const resetForm = () => {
    setForm({ elderly_id: "", blood_pressure: "", temperature: "", blood_sugar: "", weight: "", heart_rate: "", notes: "" });
    setEditingId(null);
    setDialogOpen(false);
  };

  const startEdit = (r: any) => {
    setForm({
      elderly_id: r.elderly_id,
      blood_pressure: r.blood_pressure || "",
      temperature: r.temperature?.toString() || "",
      blood_sugar: r.blood_sugar?.toString() || "",
      weight: r.weight?.toString() || "",
      heart_rate: r.heart_rate?.toString() || "",
      notes: r.notes || "",
    });
    setEditingId(r.id);
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <div>
          <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Registros de Saúde</CardTitle>
          <CardDescription>Registre e acompanhe os sinais vitais · {records.length} registro{records.length !== 1 ? "s" : ""}</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={elderlyList.length === 0}><Plus className="w-4 h-4 mr-1" /> Novo Registro</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                {editingId ? "Editar Registro" : "Novo Registro de Saúde"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Idoso *</Label>
                <Select value={form.elderly_id} onValueChange={(v) => setForm({ ...form, elderly_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o idoso" /></SelectTrigger>
                  <SelectContent>{elderlyList.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Separator />
              <p className="text-sm font-medium text-muted-foreground">Sinais Vitais</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Pressão Arterial</Label><Input value={form.blood_pressure} onChange={(e) => setForm({ ...form, blood_pressure: e.target.value })} placeholder="120/80" /></div>
                <div><Label>Freq. Cardíaca (bpm)</Label><Input type="number" value={form.heart_rate} onChange={(e) => setForm({ ...form, heart_rate: e.target.value })} placeholder="72" /></div>
                <div><Label>Temperatura (°C)</Label><Input type="number" step="0.1" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} placeholder="36.5" /></div>
                <div><Label>Glicemia (mg/dL)</Label><Input type="number" value={form.blood_sugar} onChange={(e) => setForm({ ...form, blood_sugar: e.target.value })} placeholder="100" /></div>
                <div><Label>Peso (kg)</Label><Input type="number" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="70" /></div>
              </div>
              <Separator />
              <div><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observações sobre o estado geral..." rows={3} /></div>
              <Button className="w-full" disabled={!form.elderly_id} onClick={() => upsertRecord.mutate()}>
                {editingId ? "Salvar Alterações" : "Registrar Sinais Vitais"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
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
         records.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Activity className="w-10 h-10 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">Nenhum registro encontrado.</p>
            <p className="text-sm text-muted-foreground">Registre os sinais vitais dos idosos que você atende.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((r: any) => {
              const date = new Date(r.recorded_at);
              const hasVitals = r.blood_pressure || r.temperature || r.blood_sugar || r.weight || r.heart_rate;
              return (
                <div key={r.id} className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                        <Heart className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{r.elderly?.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {date.toLocaleDateString("pt-BR")} às {date.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(r)}><Edit className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => remove.mutate(r.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  {hasVitals && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                      {r.blood_pressure && <VitalCard icon={Gauge} label="Pressão" value={r.blood_pressure} unit="mmHg" color="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400" />}
                      {r.heart_rate && <VitalCard icon={Heart} label="FC" value={r.heart_rate} unit="bpm" color="bg-pink-50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-900/30 text-pink-700 dark:text-pink-400" />}
                      {r.temperature && <VitalCard icon={Thermometer} label="Temp" value={r.temperature} unit="°C" color="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/30 text-orange-700 dark:text-orange-400" />}
                      {r.blood_sugar && <VitalCard icon={Droplets} label="Glicemia" value={r.blood_sugar} unit="mg/dL" color="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/30 text-purple-700 dark:text-purple-400" />}
                      {r.weight && <VitalCard icon={Weight} label="Peso" value={r.weight} unit="kg" color="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30 text-blue-700 dark:text-blue-400" />}
                    </div>
                  )}
                  {r.notes && (
                    <div className="p-2.5 rounded-lg bg-muted/50 text-sm text-muted-foreground">📝 {r.notes}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
