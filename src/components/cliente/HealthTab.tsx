import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Activity, Heart, Thermometer, Droplets, Weight, Gauge } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

function VitalCard({ icon: Icon, label, value, unit, color }: { icon: any; label: string; value: string | number; unit: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${color}`}>
      <Icon className="w-4 h-4 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}<span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span></p>
      </div>
    </div>
  );
}

export function HealthTab() {
  const { user } = useAuth();
  const [selectedElderly, setSelectedElderly] = useState<string>("");

  const { data: elderlyList = [] } = useQuery({
    queryKey: ["elderly", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("elderly").select("id, name").eq("responsible_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["health-records-client", user?.id, selectedElderly],
    queryFn: async () => {
      let query = supabase.from("health_records").select("*, elderly!inner(name, responsible_id)").order("recorded_at", { ascending: false });
      if (selectedElderly) query = query.eq("elderly_id", selectedElderly);
      const { data, error } = await query;
      if (error) throw error;
      return data.filter((r: any) => r.elderly?.responsible_id === user!.id);
    },
    enabled: !!user,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Registros de Saúde</CardTitle>
        <CardDescription>Registros preenchidos pelos cuidadores · {records.length} registro{records.length !== 1 ? "s" : ""}</CardDescription>
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
         records.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Activity className="w-10 h-10 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">Nenhum registro de saúde encontrado.</p>
            <p className="text-sm text-muted-foreground">Os cuidadores preencherão os registros durante os atendimentos.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((r: any) => {
              const date = new Date(r.recorded_at);
              const hasVitals = r.blood_pressure || r.temperature || r.blood_sugar || r.weight || r.heart_rate;

              return (
                <div key={r.id} className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                        <Heart className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{r.elderly?.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {date.toLocaleDateString("pt-BR")} às {date.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {hasVitals && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                      {r.blood_pressure && (
                        <VitalCard icon={Gauge} label="Pressão" value={r.blood_pressure} unit="mmHg" color="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400" />
                      )}
                      {r.heart_rate && (
                        <VitalCard icon={Heart} label="Freq. Cardíaca" value={r.heart_rate} unit="bpm" color="bg-pink-50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-900/30 text-pink-700 dark:text-pink-400" />
                      )}
                      {r.temperature && (
                        <VitalCard icon={Thermometer} label="Temperatura" value={r.temperature} unit="°C" color="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/30 text-orange-700 dark:text-orange-400" />
                      )}
                      {r.blood_sugar && (
                        <VitalCard icon={Droplets} label="Glicemia" value={r.blood_sugar} unit="mg/dL" color="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/30 text-purple-700 dark:text-purple-400" />
                      )}
                      {r.weight && (
                        <VitalCard icon={Weight} label="Peso" value={r.weight} unit="kg" color="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30 text-blue-700 dark:text-blue-400" />
                      )}
                    </div>
                  )}

                  {r.notes && (
                    <div className="p-2.5 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                      📝 {r.notes}
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
