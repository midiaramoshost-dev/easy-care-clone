import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export function DiaryTab() {
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

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["diary-client", user?.id, selectedElderly],
    queryFn: async () => {
      let query = supabase.from("diary_entries").select("*, elderly!inner(name, responsible_id)").order("created_at", { ascending: false });
      if (selectedElderly) query = query.eq("elderly_id", selectedElderly);
      const { data, error } = await query;
      if (error) throw error;
      return data.filter((d: any) => d.elderly?.responsible_id === user!.id);
    },
    enabled: !!user,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> Diário de Cuidados</CardTitle>
        <CardDescription>Entradas do diário escritas pelos cuidadores</CardDescription>
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
         entries.length === 0 ? <p className="text-muted-foreground text-center py-8">Nenhuma entrada no diário.</p> : (
          <div className="space-y-4">
            {entries.map((d: any) => (
              <div key={d.id} className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">{d.elderly?.name}</h4>
                  <span className="text-sm text-muted-foreground">{new Date(d.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
                <p className="text-sm">{d.content}</p>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  {d.mood && <span>Humor: {d.mood}</span>}
                  {d.meals && <span>Refeições: {d.meals}</span>}
                  {d.activities && <span>Atividades: {d.activities}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
