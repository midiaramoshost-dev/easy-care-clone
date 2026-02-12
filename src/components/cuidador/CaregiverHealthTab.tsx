import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Activity, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function CaregiverHealthTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
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
    queryKey: ["health-records-caregiver", user?.id],
    queryFn: async () => {
      const elderlyIds = elderlyList.map((e: any) => e.id);
      if (elderlyIds.length === 0) return [];
      const { data, error } = await supabase.from("health_records").select("*, elderly(name)").in("elderly_id", elderlyIds).order("recorded_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && elderlyList.length > 0,
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("health_records").insert({
        elderly_id: form.elderly_id,
        recorded_by: user!.id,
        blood_pressure: form.blood_pressure || null,
        temperature: form.temperature ? parseFloat(form.temperature) : null,
        blood_sugar: form.blood_sugar ? parseFloat(form.blood_sugar) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        heart_rate: form.heart_rate ? parseInt(form.heart_rate) : null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-records-caregiver"] });
      toast.success("Registro de saúde salvo!");
      setForm({ elderly_id: "", blood_pressure: "", temperature: "", blood_sugar: "", weight: "", heart_rate: "", notes: "" });
      setDialogOpen(false);
    },
    onError: () => toast.error("Erro ao salvar registro."),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Registros de Saúde</CardTitle>
          <CardDescription>Registre os sinais vitais dos idosos</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={elderlyList.length === 0}><Plus className="w-4 h-4 mr-1" /> Novo Registro</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Registro de Saúde</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Idoso *</Label>
                <Select value={form.elderly_id} onValueChange={(v) => setForm({ ...form, elderly_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{elderlyList.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Pressão Arterial</Label><Input value={form.blood_pressure} onChange={(e) => setForm({ ...form, blood_pressure: e.target.value })} placeholder="120/80" /></div>
                <div><Label>Temperatura (°C)</Label><Input type="number" step="0.1" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} /></div>
                <div><Label>Glicemia</Label><Input type="number" value={form.blood_sugar} onChange={(e) => setForm({ ...form, blood_sugar: e.target.value })} /></div>
                <div><Label>Peso (kg)</Label><Input type="number" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} /></div>
                <div><Label>Freq. Cardíaca</Label><Input type="number" value={form.heart_rate} onChange={(e) => setForm({ ...form, heart_rate: e.target.value })} /></div>
              </div>
              <div><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button className="w-full" disabled={!form.elderly_id} onClick={() => create.mutate()}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-muted-foreground text-center py-8">Carregando...</p> :
         records.length === 0 ? <p className="text-muted-foreground text-center py-8">Nenhum registro encontrado.</p> : (
          <div className="space-y-3">
            {records.map((r: any) => (
              <div key={r.id} className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">{r.elderly?.name}</h4>
                  <span className="text-sm text-muted-foreground">{new Date(r.recorded_at).toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                  {r.blood_pressure && <div><span className="text-muted-foreground">Pressão:</span> {r.blood_pressure}</div>}
                  {r.temperature && <div><span className="text-muted-foreground">Temp:</span> {r.temperature}°C</div>}
                  {r.blood_sugar && <div><span className="text-muted-foreground">Glicemia:</span> {r.blood_sugar}</div>}
                  {r.weight && <div><span className="text-muted-foreground">Peso:</span> {r.weight}kg</div>}
                  {r.heart_rate && <div><span className="text-muted-foreground">FC:</span> {r.heart_rate}bpm</div>}
                </div>
                {r.notes && <p className="text-sm text-muted-foreground">{r.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
