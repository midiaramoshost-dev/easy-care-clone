import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, User, Calendar, Heart, Phone, AlertTriangle, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

function calcAge(birthDate: string) {
  const today = new Date();
  const birth = new Date(birthDate + "T00:00:00");
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function CaregiverElderlyTab() {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: elderlyList = [], isLoading } = useQuery({
    queryKey: ["caregiver-elderly", user?.id],
    queryFn: async () => {
      const { data: appointments, error: aptErr } = await supabase
        .from("appointments")
        .select("client_id")
        .eq("caregiver_id", user!.id)
        .in("status", ["pending", "confirmed", "in_progress"]);
      if (aptErr) throw aptErr;
      const clientIds = [...new Set(appointments.map((a) => a.client_id))];
      if (clientIds.length === 0) return [];
      const { data, error } = await supabase.from("elderly").select("*").in("responsible_id", clientIds);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch medication counts
  const { data: medCounts = {} } = useQuery({
    queryKey: ["caregiver-elderly-meds", elderlyList.map((e: any) => e.id).join(",")],
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Idosos Atendidos</CardTitle>
        <CardDescription>Idosos dos seus agendamentos ativos · {elderlyList.length} idoso{elderlyList.length !== 1 ? "s" : ""}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-muted-foreground text-center py-8">Carregando...</p> :
         elderlyList.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">Nenhum idoso vinculado.</p>
            <p className="text-sm text-muted-foreground">Seus idosos aparecerão aqui quando houver agendamentos ativos.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {elderlyList.map((e: any) => {
              const isExpanded = expandedId === e.id;
              const age = e.birth_date ? calcAge(e.birth_date) : null;
              const activeMeds = medCounts[e.id] || 0;

              return (
                <div key={e.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
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
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>

                  {isExpanded && (
                    <div className="border-t px-4 pb-4 pt-3 space-y-4 bg-muted/10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados Pessoais</p>
                          {e.birth_date && (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>Nascimento: {new Date(e.birth_date + "T00:00:00").toLocaleDateString("pt-BR")} ({age} anos)</span>
                            </div>
                          )}
                        </div>
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

                      {e.special_needs && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Necessidades Especiais</p>
                          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30">
                            <p className="text-sm">{e.special_needs}</p>
                          </div>
                        </div>
                      )}

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
