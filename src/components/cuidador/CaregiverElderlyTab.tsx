import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export function CaregiverElderlyTab() {
  const { user } = useAuth();

  const { data: elderlyList = [], isLoading } = useQuery({
    queryKey: ["caregiver-elderly", user?.id],
    queryFn: async () => {
      // Get client IDs from active appointments
      const { data: appointments, error: aptErr } = await supabase
        .from("appointments")
        .select("client_id")
        .eq("caregiver_id", user!.id)
        .in("status", ["pending", "confirmed", "in_progress"]);
      if (aptErr) throw aptErr;

      const clientIds = [...new Set(appointments.map((a) => a.client_id))];
      if (clientIds.length === 0) return [];

      const { data, error } = await supabase
        .from("elderly")
        .select("*")
        .in("responsible_id", clientIds);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Idosos Atendidos</CardTitle>
        <CardDescription>Idosos dos seus agendamentos ativos</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-muted-foreground text-center py-8">Carregando...</p> :
         elderlyList.length === 0 ? <p className="text-muted-foreground text-center py-8">Nenhum idoso vinculado aos seus atendimentos.</p> : (
          <div className="space-y-3">
            {elderlyList.map((e: any) => (
              <div key={e.id} className="p-4 rounded-lg bg-muted/50 space-y-1">
                <h4 className="font-semibold">{e.name}</h4>
                {e.birth_date && <p className="text-sm text-muted-foreground">Nascimento: {new Date(e.birth_date + "T00:00:00").toLocaleDateString("pt-BR")}</p>}
                {e.medical_conditions && <p className="text-sm text-muted-foreground">Condições: {e.medical_conditions}</p>}
                {e.special_needs && <p className="text-sm text-muted-foreground">Necessidades: {e.special_needs}</p>}
                {e.emergency_contact && <p className="text-sm text-muted-foreground">Emergência: {e.emergency_contact} - {e.emergency_phone}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
