import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  administered: { label: "Administrado", variant: "default" },
  skipped: { label: "Ignorado", variant: "secondary" },
};

export function CaregiverRemindersTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ["reminders-caregiver", user?.id, elderlyList],
    queryFn: async () => {
      const elderlyIds = elderlyList.map((e: any) => e.id);
      if (elderlyIds.length === 0) return [];
      const { data, error } = await supabase
        .from("medication_reminders")
        .select("*, medications!inner(name, dosage, elderly_id, elderly(name))")
        .in("medications.elderly_id", elderlyIds)
        .order("scheduled_time", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user && elderlyList.length > 0,
  });

  const markAdministered = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("medication_reminders").update({
        status: "administered" as any,
        administered_by: user!.id,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders-caregiver"] });
      toast.success("Medicamento marcado como administrado!");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5 text-primary" /> Lembretes de Medicamento</CardTitle>
        <CardDescription>Medicamentos dos idosos que você atende</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-muted-foreground text-center py-8">Carregando...</p> :
         reminders.length === 0 ? <p className="text-muted-foreground text-center py-8">Nenhum lembrete de medicamento.</p> : (
          <div className="space-y-3">
            {reminders.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{r.medications?.name}</h4>
                    <Badge variant={statusLabels[r.status]?.variant || "outline"}>
                      {statusLabels[r.status]?.label || r.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.medications?.elderly?.name}</p>
                  {r.medications?.dosage && <p className="text-sm text-muted-foreground">Dosagem: {r.medications.dosage}</p>}
                  <p className="text-sm text-muted-foreground">Horário: {new Date(r.scheduled_time).toLocaleString("pt-BR")}</p>
                </div>
                {r.status === "pending" && (
                  <Button size="sm" onClick={() => markAdministered.mutate(r.id)}>
                    <Check className="w-4 h-4 mr-1" /> Administrado
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
