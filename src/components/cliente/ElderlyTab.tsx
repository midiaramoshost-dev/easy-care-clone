import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function ElderlyTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", birth_date: "", medical_conditions: "", special_needs: "",
    emergency_contact: "", emergency_phone: "", notes: "",
  });

  const { data: elderlyList = [], isLoading } = useQuery({
    queryKey: ["elderly", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("elderly")
        .select("*")
        .eq("responsible_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const upsert = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const { error } = await supabase.from("elderly").update(form).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("elderly").insert({ ...form, responsible_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["elderly"] });
      toast.success(editingId ? "Idoso atualizado!" : "Idoso cadastrado!");
      resetForm();
    },
    onError: () => toast.error("Erro ao salvar."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("elderly").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["elderly"] });
      toast.success("Idoso removido.");
    },
  });

  const resetForm = () => {
    setForm({ name: "", birth_date: "", medical_conditions: "", special_needs: "", emergency_contact: "", emergency_phone: "", notes: "" });
    setEditingId(null);
    setDialogOpen(false);
  };

  const startEdit = (e: any) => {
    setForm({
      name: e.name, birth_date: e.birth_date || "", medical_conditions: e.medical_conditions || "",
      special_needs: e.special_needs || "", emergency_contact: e.emergency_contact || "",
      emergency_phone: e.emergency_phone || "", notes: e.notes || "",
    });
    setEditingId(e.id);
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Meus Idosos</CardTitle>
          <CardDescription>Cadastre e gerencie os idosos sob seus cuidados</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Cadastrar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Editar Idoso" : "Cadastrar Idoso"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Data de Nascimento</Label><Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} /></div>
              <div><Label>Condições Médicas</Label><Textarea value={form.medical_conditions} onChange={(e) => setForm({ ...form, medical_conditions: e.target.value })} /></div>
              <div><Label>Necessidades Especiais</Label><Textarea value={form.special_needs} onChange={(e) => setForm({ ...form, special_needs: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Contato Emergência</Label><Input value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} /></div>
                <div><Label>Telefone Emergência</Label><Input value={form.emergency_phone} onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })} /></div>
              </div>
              <div><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button className="w-full" disabled={!form.name} onClick={() => upsert.mutate()}>
                {editingId ? "Salvar Alterações" : "Cadastrar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-muted-foreground text-center py-8">Carregando...</p> :
         elderlyList.length === 0 ? <p className="text-muted-foreground text-center py-8">Nenhum idoso cadastrado.</p> : (
          <div className="space-y-3">
            {elderlyList.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="space-y-1">
                  <h4 className="font-semibold">{e.name}</h4>
                  {e.birth_date && <p className="text-sm text-muted-foreground">Nascimento: {new Date(e.birth_date + "T00:00:00").toLocaleDateString("pt-BR")}</p>}
                  {e.medical_conditions && <p className="text-sm text-muted-foreground">Condições: {e.medical_conditions}</p>}
                  {e.emergency_contact && <p className="text-sm text-muted-foreground">Emergência: {e.emergency_contact} - {e.emergency_phone}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(e)}><Edit className="w-4 h-4" /></Button>
                  <Button size="sm" variant="destructive" onClick={() => remove.mutate(e.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
