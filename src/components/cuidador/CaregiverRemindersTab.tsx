import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, X, Pill, Clock } from "lucide-react";
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

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const payload: any = { status };
      if (status === "administered") payload.administered_by = user!.id;
      const { error } = await supabase.from("medication_reminders").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["reminders-caregiver"] });
      toast.success(vars.status === "administered" ? "Medicamento administrado!" : "Lembrete ignorado.");
    },
  });

  const pendingReminders = reminders.filter((r: any) => r.status === "pending");
  const doneReminders = reminders.filter((r: any) => r.status !== "pending");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5 text-primary" /> Lembretes de Medicamento</CardTitle>
        <CardDescription>
          {pendingReminders.length} pendente{pendingReminders.length !== 1 ? "s" : ""} · {doneReminders.length} concluído{doneReminders.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-muted-foreground text-center py-8">Carregando...</p> :
         reminders.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">Nenhum lembrete de medicamento.</p>
            <p className="text-sm text-muted-foreground">Os lembretes aparecerão aqui quando medicamentos forem configurados.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pending first */}
            {pendingReminders.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pendentes</p>
                {pendingReminders.map((r: any) => {
                  const scheduledTime = new Date(r.scheduled_time);
                  const isLate = scheduledTime < new Date();
                  return (
                    <div key={r.id} className={`rounded-xl border p-4 ${isLate ? 'border-red-300 bg-red-50 dark:bg-red-950/10 dark:border-red-900/30' : 'border-amber-300 bg-amber-50 dark:bg-amber-950/10 dark:border-amber-900/30'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Pill className="w-4 h-4 text-primary" />
                            <h4 className="font-semibold">{r.medications?.name}</h4>
                            {isLate && <Badge variant="destructive" className="text-xs">Atrasado</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{r.medications?.elderly?.name}</p>
                          {r.medications?.dosage && <p className="text-sm font-medium">💊 {r.medications.dosage}</p>}
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{scheduledTime.toLocaleString("pt-BR")}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" onClick={() => updateStatus.mutate({ id: r.id, status: "administered" })}>
                            <Check className="w-4 h-4 mr-1" /> Administrado
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: r.id, status: "skipped" })}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Done */}
            {doneReminders.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Concluídos</p>
                {doneReminders.map((r: any) => (
                  <div key={r.id} className="rounded-xl border bg-card p-4 opacity-70">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">{r.medications?.name}</h4>
                          <Badge variant={statusLabels[r.status]?.variant || "outline"}>
                            {statusLabels[r.status]?.label || r.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{r.medications?.elderly?.name} · {new Date(r.scheduled_time).toLocaleString("pt-BR")}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
