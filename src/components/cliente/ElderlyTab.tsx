import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, Plus, Edit, Trash2, User, Calendar, Heart, Phone, AlertTriangle, FileText, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

function calcAge(birthDate: string) {
  const today = new Date();
  const birth = new Date(birthDate + "T00:00:00");
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function ElderlyTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

  // Fetch medication count per elderly
  const { data: medCounts = {} } = useQuery({
    queryKey: ["elderly-med-counts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medications")
        .select("elderly_id, active")
        .in("elderly_id", elderlyList.map((e: any) => e.id));
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((m: any) => { if (m.active) counts[m.elderly_id] = (counts[m.elderly_id] || 0) + 1; });
      return counts;
    },
    enabled: elderlyList.length > 0,
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        birth_date: form.birth_date || null,
        medical_conditions: form.medical_conditions || null,
        special_needs: form.special_needs || null,
        emergency_contact: form.emergency_contact || null,
        emergency_phone: form.emergency_phone || null,
        notes: form.notes || null,
      };
      if (editingId) {
        const { error } = await supabase.from("elderly").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("elderly").insert({ ...payload, responsible_id: user!.id });
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
          <CardDescription>Cadastre e gerencie os idosos sob seus cuidados ({elderlyList.length} cadastrado{elderlyList.length !== 1 ? "s" : ""})</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Cadastrar Idoso</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                {editingId ? "Editar Idoso" : "Cadastrar Novo Idoso"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Separator />
              <p className="text-sm font-medium text-muted-foreground">Dados Pessoais</p>
              <div>
                <Label>Nome Completo *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo do idoso" />
              </div>
              <div>
                <Label>Data de Nascimento</Label>
                <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
                {form.birth_date && (
                  <p className="text-xs text-muted-foreground mt-1">{calcAge(form.birth_date)} anos</p>
                )}
              </div>

              <Separator />
              <p className="text-sm font-medium text-muted-foreground">Informações Médicas</p>
              <div>
                <Label>Condições Médicas</Label>
                <Textarea 
                  value={form.medical_conditions} 
                  onChange={(e) => setForm({ ...form, medical_conditions: e.target.value })}
                  placeholder="Ex: Diabetes tipo 2, Hipertensão, Alzheimer..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Necessidades Especiais</Label>
                <Textarea 
                  value={form.special_needs} 
                  onChange={(e) => setForm({ ...form, special_needs: e.target.value })}
                  placeholder="Ex: Cadeira de rodas, dieta restrita, auxílio para banho..."
                  rows={3}
                />
              </div>

              <Separator />
              <p className="text-sm font-medium text-muted-foreground">Contato de Emergência</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nome do Contato</Label>
                  <Input value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} placeholder="Nome" />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input value={form.emergency_phone} onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })} placeholder="(00) 00000-0000" />
                </div>
              </div>

              <Separator />
              <div>
                <Label>Observações Gerais</Label>
                <Textarea 
                  value={form.notes} 
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Preferências, rotina, informações adicionais..."
                  rows={3}
                />
              </div>
              <Button className="w-full" disabled={!form.name} onClick={() => upsert.mutate()}>
                {editingId ? "Salvar Alterações" : "Cadastrar Idoso"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-muted-foreground text-center py-8">Carregando...</p> :
         elderlyList.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">Nenhum idoso cadastrado ainda.</p>
            <p className="text-sm text-muted-foreground">Cadastre o primeiro idoso para começar a gerenciar seus cuidados.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {elderlyList.map((e: any) => {
              const isExpanded = expandedId === e.id;
              const age = e.birth_date ? calcAge(e.birth_date) : null;
              const activeMeds = medCounts[e.id] || 0;

              return (
                <div key={e.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                  {/* Header */}
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : e.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-base">{e.name}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {age !== null && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" /> {age} anos
                            </span>
                          )}
                          {activeMeds > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {activeMeds} medicamento{activeMeds !== 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={(ev) => { ev.stopPropagation(); startEdit(e); }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={(ev) => { ev.stopPropagation(); remove.mutate(e.id); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t px-4 pb-4 pt-3 space-y-4 bg-muted/10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Personal Info */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados Pessoais</p>
                          {e.birth_date && (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>Nascimento: {new Date(e.birth_date + "T00:00:00").toLocaleDateString("pt-BR")} ({age} anos)</span>
                            </div>
                          )}
                        </div>

                        {/* Emergency */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato de Emergência</p>
                          {e.emergency_contact ? (
                            <>
                              <div className="flex items-center gap-2 text-sm">
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                                <span>{e.emergency_contact}</span>
                              </div>
                              {e.emergency_phone && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="w-4 h-4 text-muted-foreground" />
                                  <span>{e.emergency_phone}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">Não informado</p>
                          )}
                        </div>
                      </div>

                      {/* Medical Info */}
                      {e.medical_conditions && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Condições Médicas</p>
                          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30">
                            <div className="flex items-start gap-2">
                              <Heart className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                              <p className="text-sm">{e.medical_conditions}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Special Needs */}
                      {e.special_needs && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Necessidades Especiais</p>
                          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30">
                            <p className="text-sm">{e.special_needs}</p>
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {e.notes && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Observações</p>
                          <div className="p-3 rounded-lg bg-muted/50">
                            <div className="flex items-start gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                              <p className="text-sm">{e.notes}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
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
