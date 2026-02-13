import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Clock, DollarSign, Award, User } from "lucide-react";
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
        <CardDescription>Suas informações como cuidador profissional</CardDescription>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-4 max-w-lg">
            <p className="text-sm font-medium text-muted-foreground">Informações Profissionais</p>
            <div>
              <Label>Especialidade</Label>
              <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="Ex: Geriatria, Alzheimer, Pós-operatório" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Anos de Experiência</Label>
                <Input type="number" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Valor/Hora (R$)</Label>
                <Input type="number" step="0.01" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div>
              <Label>Disponibilidade</Label>
              <Input value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} placeholder="Ex: Seg-Sex 8h-18h, Sábados manhã" />
            </div>
            <Separator />
            <div>
              <Label>Sobre Você</Label>
              <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Fale sobre sua experiência, formação, certificações, motivação..." rows={5} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => upsert.mutate()}>Salvar Perfil</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
            </div>
          </div>
        ) : caregiver ? (
          <div className="space-y-4 max-w-lg">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{caregiver.specialty || "Cuidador"}</h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {caregiver.experience_years > 0 && (
                    <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" /> {caregiver.experience_years} anos exp.</span>
                  )}
                  {caregiver.active && <Badge variant="default" className="text-xs">Ativo</Badge>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Clock className="w-4 h-4" /> Disponibilidade
                </div>
                <p className="text-sm font-medium">{caregiver.availability || "Não informado"}</p>
              </div>
              <div className="p-3 rounded-lg border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <DollarSign className="w-4 h-4" /> Valor/Hora
                </div>
                <p className="text-sm font-medium">R$ {caregiver.hourly_rate || 0}</p>
              </div>
            </div>

            {caregiver.bio && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sobre</p>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-sm leading-relaxed">{caregiver.bio}</p>
                </div>
              </div>
            )}

            <Button onClick={startEdit}>Editar Perfil Profissional</Button>
          </div>
        ) : (
          <div className="text-center py-12 space-y-3">
            <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">Perfil profissional não configurado.</p>
            <p className="text-sm text-muted-foreground">Configure seu perfil para que clientes conheçam suas qualificações.</p>
            <Button onClick={startEdit}>Criar Perfil Profissional</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
