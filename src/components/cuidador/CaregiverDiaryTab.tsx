import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Plus, Edit, Trash2, Smile, Frown, Meh, Coffee, Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const moodOptions = ["Bem", "Normal", "Mal", "Feliz", "Triste", "Agitado", "Calmo", "Sonolento"];

const moodMap: Record<string, { icon: any; label: string; color: string }> = {
  "bem": { icon: Smile, label: "Bem", color: "text-green-600 bg-green-100 dark:bg-green-950/30" },
  "normal": { icon: Meh, label: "Normal", color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-950/30" },
  "mal": { icon: Frown, label: "Mal", color: "text-red-600 bg-red-100 dark:bg-red-950/30" },
  "feliz": { icon: Smile, label: "Feliz", color: "text-green-600 bg-green-100 dark:bg-green-950/30" },
  "triste": { icon: Frown, label: "Triste", color: "text-blue-600 bg-blue-100 dark:bg-blue-950/30" },
  "agitado": { icon: Meh, label: "Agitado", color: "text-orange-600 bg-orange-100 dark:bg-orange-950/30" },
  "calmo": { icon: Smile, label: "Calmo", color: "text-teal-600 bg-teal-100 dark:bg-teal-950/30" },
  "sonolento": { icon: Meh, label: "Sonolento", color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-950/30" },
};

function getMood(mood: string | null) {
  if (!mood) return null;
  return moodMap[mood.toLowerCase().trim()] || { icon: Meh, label: mood, color: "text-muted-foreground bg-muted" };
}

export function CaregiverDiaryTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedElderly, setSelectedElderly] = useState<string>("");
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
    queryKey: ["diary-caregiver", user?.id, selectedElderly],
    queryFn: async () => {
      let query = supabase.from("diary_entries").select("*, elderly(name)").eq("author_id", user!.id).order("created_at", { ascending: false });
      if (selectedElderly) query = query.eq("elderly_id", selectedElderly);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const upsertEntry = useMutation({
    mutationFn: async () => {
      const payload = {
        elderly_id: form.elderly_id,
        author_id: user!.id,
        content: form.content,
        mood: form.mood || null,
        meals: form.meals || null,
        activities: form.activities || null,
      };
      if (editingId) {
        const { error } = await supabase.from("diary_entries").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("diary_entries").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diary-caregiver"] });
      toast.success(editingId ? "Entrada atualizada!" : "Entrada no diário salva!");
      resetForm();
    },
    onError: () => toast.error("Erro ao salvar entrada."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("diary_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diary-caregiver"] });
      toast.success("Entrada removida.");
    },
  });

  const resetForm = () => {
    setForm({ elderly_id: "", content: "", mood: "", meals: "", activities: "" });
    setEditingId(null);
    setDialogOpen(false);
  };

  const startEdit = (d: any) => {
    setForm({
      elderly_id: d.elderly_id,
      content: d.content,
      mood: d.mood || "",
      meals: d.meals || "",
      activities: d.activities || "",
    });
    setEditingId(d.id);
    setDialogOpen(true);
  };

  // Group by date
  const grouped = entries.reduce((acc: Record<string, any[]>, entry: any) => {
    const dateKey = new Date(entry.created_at).toLocaleDateString("pt-BR");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(entry);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <div>
          <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> Diário de Cuidados</CardTitle>
          <CardDescription>Registre o dia a dia dos idosos · {entries.length} entrada{entries.length !== 1 ? "s" : ""}</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={elderlyList.length === 0}><Plus className="w-4 h-4 mr-1" /> Nova Entrada</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                {editingId ? "Editar Entrada" : "Nova Entrada no Diário"}
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
              <div>
                <Label>Relato do Dia *</Label>
                <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Como foi o dia do idoso? Descreva atividades, comportamento, alimentação..." rows={5} />
              </div>
              <div>
                <Label>Humor</Label>
                <Select value={form.mood} onValueChange={(v) => setForm({ ...form, mood: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o humor" /></SelectTrigger>
                  <SelectContent>
                    {moodOptions.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Refeições</Label>
                <Textarea value={form.meals} onChange={(e) => setForm({ ...form, meals: e.target.value })} placeholder="Ex: Café da manhã completo, almoçou bem, lanche..." rows={2} />
              </div>
              <div>
                <Label>Atividades Realizadas</Label>
                <Textarea value={form.activities} onChange={(e) => setForm({ ...form, activities: e.target.value })} placeholder="Ex: Caminhada 20min, leitura, jogos de memória..." rows={2} />
              </div>
              <Button className="w-full" disabled={!form.elderly_id || !form.content} onClick={() => upsertEntry.mutate()}>
                {editingId ? "Salvar Alterações" : "Registrar no Diário"}
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
         entries.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">Nenhuma entrada no diário.</p>
            <p className="text-sm text-muted-foreground">Registre o dia a dia dos idosos que você atende.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([dateKey, dayEntries]) => (
              <div key={dateKey}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-border" />
                  <Badge variant="outline" className="text-xs font-normal">{dateKey}</Badge>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-3 relative before:absolute before:left-4 before:top-0 before:bottom-0 before:w-0.5 before:bg-border">
                  {(dayEntries as any[]).map((d: any) => {
                    const mood = getMood(d.mood);
                    const MoodIcon = mood?.icon;
                    const time = new Date(d.created_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div key={d.id} className="ml-8 relative">
                        <div className="absolute -left-[1.35rem] top-3 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
                        <div className="rounded-xl border bg-card p-4 space-y-2.5">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-sm">{d.elderly?.name}</h4>
                              {mood && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${mood.color}`}>
                                  <MoodIcon className="w-3.5 h-3.5" /> {mood.label}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-xs text-muted-foreground mr-1">{time}</span>
                              <Button size="sm" variant="ghost" onClick={() => startEdit(d)}><Edit className="w-3.5 h-3.5" /></Button>
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => remove.mutate(d.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed">{d.content}</p>
                          <div className="flex gap-3 flex-wrap">
                            {d.meals && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-lg">
                                <Coffee className="w-3.5 h-3.5" />
                                <span><strong>Refeições:</strong> {d.meals}</span>
                              </div>
                            )}
                            {d.activities && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-lg">
                                <Dumbbell className="w-3.5 h-3.5" />
                                <span><strong>Atividades:</strong> {d.activities}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
