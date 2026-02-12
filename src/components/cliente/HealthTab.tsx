import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

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
        <CardDescription>Registros preenchidos pelos cuidadores</CardDescription>
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
         records.length === 0 ? <p className="text-muted-foreground text-center py-8">Nenhum registro de saúde encontrado.</p> : (
          <div className="space-y-3">
            {records.map((r: any) => (
              <div key={r.id} className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">{r.elderly?.name}</h4>
                  <span className="text-sm text-muted-foreground">{new Date(r.recorded_at).toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                  {r.blood_pressure && <div><span className="text-muted-foreground">Pressão:</span> {r.blood_pressure}</div>}
                  {r.temperature && <div><span className="text-muted-foreground">Temp:</span> {r.temperature}°C</div>}
                  {r.blood_sugar && <div><span className="text-muted-foreground">Glicemia:</span> {r.blood_sugar}</div>}
                  {r.weight && <div><span className="text-muted-foreground">Peso:</span> {r.weight}kg</div>}
                  {r.heart_rate && <div><span className="text-muted-foreground">FC:</span> {r.heart_rate}bpm</div>}
                </div>
                {r.notes && <p className="text-sm text-muted-foreground">{r.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
