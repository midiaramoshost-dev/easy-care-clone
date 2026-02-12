import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Pill, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function MedicationsTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedElderly, setSelectedElderly] = useState<string>("");
  const [form, setForm] = useState({ name: "", dosage: "", frequency: "", notes: "", elderly_id: "" });

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
      if (selectedElderly) {
        query = query.eq("elderly_id", selectedElderly);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data.filter((m: any) => m.elderly?.responsible_id === user!.id);
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("medications").insert({
        elderly_id: form.elderly_id,
        name: form.name,
        dosage: form.dosage || null,
        frequency: form.frequency || null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      toast.success("Medicamento adicionado!");
      setForm({ name: "", dosage: "", frequency: "", notes: "", elderly_id: "" });
      setDialogOpen(false);
    },
    onError: () => toast.error("Erro ao salvar medicamento."),
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Pill className="w-5 h-5 text-primary" /> Medicamentos</CardTitle>
          <CardDescription>Gerencie os medicamentos dos seus idosos</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={elderlyList.length === 0}><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Medicamento</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Idoso *</Label>
                <Select value={form.elderly_id} onValueChange={(v) => setForm({ ...form, elderly_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {elderlyList.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Nome do Medicamento *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Dosagem</Label><Input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} placeholder="Ex: 500mg" /></div>
              <div><Label>Frequência</Label><Input value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} placeholder="Ex: 2x ao dia" /></div>
              <div><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button className="w-full" disabled={!form.name || !form.elderly_id} onClick={() => create.mutate()}>Salvar</Button>
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
         medications.length === 0 ? <p className="text-muted-foreground text-center py-8">Nenhum medicamento cadastrado.</p> : (
          <div className="space-y-3">
            {medications.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{m.name}</h4>
                    {m.active && <Badge variant="default">Ativo</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{m.elderly?.name}</p>
                  {m.dosage && <p className="text-sm text-muted-foreground">Dosagem: {m.dosage}</p>}
                  {m.frequency && <p className="text-sm text-muted-foreground">Frequência: {m.frequency}</p>}
                </div>
                <Button size="sm" variant="destructive" onClick={() => remove.mutate(m.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
