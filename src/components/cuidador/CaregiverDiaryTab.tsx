import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function CaregiverDiaryTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    elderly_id: "", content: "", mood: "", meals: "", activities: "",
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

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["diary-caregiver", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("diary_entries").select("*, elderly(name)").eq("author_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("diary_entries").insert({
        elderly_id: form.elderly_id,
        author_id: user!.id,
        content: form.content,
        mood: form.mood || null,
        meals: form.meals || null,
        activities: form.activities || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diary-caregiver"] });
      toast.success("Entrada no diário salva!");
      setForm({ elderly_id: "", content: "", mood: "", meals: "", activities: "" });
      setDialogOpen(false);
    },
    onError: () => toast.error("Erro ao salvar entrada."),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> Diário de Cuidados</CardTitle>
          <CardDescription>Registre o dia a dia dos idosos</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={elderlyList.length === 0}><Plus className="w-4 h-4 mr-1" /> Nova Entrada</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Entrada no Diário</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Idoso *</Label>
                <Select value={form.elderly_id} onValueChange={(v) => setForm({ ...form, elderly_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{elderlyList.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Relato do Dia *</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Como foi o dia..." rows={4} /></div>
              <div><Label>Humor</Label><Input value={form.mood} onChange={(e) => setForm({ ...form, mood: e.target.value })} placeholder="Ex: Bem disposto, calmo" /></div>
              <div><Label>Refeições</Label><Input value={form.meals} onChange={(e) => setForm({ ...form, meals: e.target.value })} placeholder="Ex: Almoçou bem, jantou pouco" /></div>
              <div><Label>Atividades</Label><Input value={form.activities} onChange={(e) => setForm({ ...form, activities: e.target.value })} placeholder="Ex: Caminhada, leitura" /></div>
              <Button className="w-full" disabled={!form.elderly_id || !form.content} onClick={() => create.mutate()}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-muted-foreground text-center py-8">Carregando...</p> :
         entries.length === 0 ? <p className="text-muted-foreground text-center py-8">Nenhuma entrada no diário.</p> : (
          <div className="space-y-4">
            {entries.map((d: any) => (
              <div key={d.id} className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">{d.elderly?.name}</h4>
                  <span className="text-sm text-muted-foreground">{new Date(d.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
                <p className="text-sm">{d.content}</p>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  {d.mood && <span>Humor: {d.mood}</span>}
                  {d.meals && <span>Refeições: {d.meals}</span>}
                  {d.activities && <span>Atividades: {d.activities}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
