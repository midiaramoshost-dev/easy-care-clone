import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function CaregiverProfileTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    specialty: "", experience_years: 0, availability: "", bio: "", hourly_rate: 0,
  });

  const { data: caregiver, isLoading } = useQuery({
    queryKey: ["caregiver-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("caregivers").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const upsert = useMutation({
    mutationFn: async () => {
      if (caregiver) {
        const { error } = await supabase.from("caregivers").update(form).eq("id", user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("caregivers").insert({ ...form, id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caregiver-profile"] });
      toast.success("Perfil profissional salvo!");
      setEditing(false);
    },
    onError: () => toast.error("Erro ao salvar perfil."),
  });

  const startEdit = () => {
    setForm({
      specialty: caregiver?.specialty || "",
      experience_years: caregiver?.experience_years || 0,
      availability: caregiver?.availability || "",
      bio: caregiver?.bio || "",
      hourly_rate: caregiver?.hourly_rate || 0,
    });
    setEditing(true);
  };

  if (isLoading) return <p className="text-muted-foreground text-center py-8">Carregando...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary" /> Perfil Profissional</CardTitle>
        <CardDescription>Suas informações como cuidador</CardDescription>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-4 max-w-md">
            <div><Label>Especialidade</Label><Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="Ex: Geriatria, Alzheimer" /></div>
            <div><Label>Anos de Experiência</Label><Input type="number" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: parseInt(e.target.value) || 0 })} /></div>
            <div><Label>Disponibilidade</Label><Input value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} placeholder="Ex: Seg-Sex, 8h-18h" /></div>
            <div><Label>Valor/Hora (R$)</Label><Input type="number" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: parseFloat(e.target.value) || 0 })} /></div>
            <div><Label>Bio</Label><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Fale sobre você..." /></div>
            <div className="flex gap-2">
              <Button onClick={() => upsert.mutate()}>Salvar</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-md">
            <div><Label className="text-muted-foreground">Especialidade</Label><p className="font-medium">{caregiver?.specialty || "Não informado"}</p></div>
            <div><Label className="text-muted-foreground">Experiência</Label><p className="font-medium">{caregiver?.experience_years || 0} anos</p></div>
            <div><Label className="text-muted-foreground">Disponibilidade</Label><p className="font-medium">{caregiver?.availability || "Não informado"}</p></div>
            <div><Label className="text-muted-foreground">Valor/Hora</Label><p className="font-medium">R$ {caregiver?.hourly_rate || 0}</p></div>
            <div><Label className="text-muted-foreground">Bio</Label><p className="font-medium">{caregiver?.bio || "Não informado"}</p></div>
            <Button onClick={startEdit}>{caregiver ? "Editar Perfil" : "Criar Perfil Profissional"}</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
