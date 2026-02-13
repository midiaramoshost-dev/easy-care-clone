import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Smile, Frown, Meh, Coffee, Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const moodMap: Record<string, { icon: any; label: string; color: string }> = {
  "bem": { icon: Smile, label: "Bem", color: "text-green-600 bg-green-100 dark:bg-green-950/30" },
  "normal": { icon: Meh, label: "Normal", color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-950/30" },
  "mal": { icon: Frown, label: "Mal", color: "text-red-600 bg-red-100 dark:bg-red-950/30" },
  "feliz": { icon: Smile, label: "Feliz", color: "text-green-600 bg-green-100 dark:bg-green-950/30" },
  "triste": { icon: Frown, label: "Triste", color: "text-blue-600 bg-blue-100 dark:bg-blue-950/30" },
  "agitado": { icon: Meh, label: "Agitado", color: "text-orange-600 bg-orange-100 dark:bg-orange-950/30" },
  "calmo": { icon: Smile, label: "Calmo", color: "text-teal-600 bg-teal-100 dark:bg-teal-950/30" },
  "sonolento": { icon: Meh, label: "Sonolento", color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-950/30" },
};

function getMood(mood: string | null) {
  if (!mood) return null;
  const key = mood.toLowerCase().trim();
  return moodMap[key] || { icon: Meh, label: mood, color: "text-muted-foreground bg-muted" };
}

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

  // Group entries by date
  const grouped = entries.reduce((acc: Record<string, any[]>, entry: any) => {
    const dateKey = new Date(entry.created_at).toLocaleDateString("pt-BR");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(entry);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> Diário de Cuidados</CardTitle>
        <CardDescription>Acompanhe o dia-a-dia dos seus idosos · {entries.length} entrada{entries.length !== 1 ? "s" : ""}</CardDescription>
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
         entries.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">Nenhuma entrada no diário.</p>
            <p className="text-sm text-muted-foreground">Os cuidadores registrarão o dia-a-dia aqui.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([dateKey, dayEntries]) => (
              <div key={dateKey}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-border" />
                  <Badge variant="outline" className="text-xs font-normal">{dateKey}</Badge>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-3 relative before:absolute before:left-4 before:top-0 before:bottom-0 before:w-0.5 before:bg-border">
                  {(dayEntries as any[]).map((d: any) => {
                    const mood = getMood(d.mood);
                    const MoodIcon = mood?.icon;
                    const time = new Date(d.created_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div key={d.id} className="ml-8 relative">
                        <div className="absolute -left-[1.35rem] top-3 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
                        <div className="rounded-xl border bg-card p-4 space-y-2.5">
                          <div className="flex justify-between items-start flex-wrap gap-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm">{d.elderly?.name}</h4>
                              {mood && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${mood.color}`}>
                                  <MoodIcon className="w-3.5 h-3.5" /> {mood.label}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">{time}</span>
                          </div>
                          <p className="text-sm leading-relaxed">{d.content}</p>
                          <div className="flex gap-3 flex-wrap">
                            {d.meals && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-lg">
                                <Coffee className="w-3.5 h-3.5" />
                                <span><strong>Refeições:</strong> {d.meals}</span>
                              </div>
                            )}
                            {d.activities && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-lg">
                                <Dumbbell className="w-3.5 h-3.5" />
                                <span><strong>Atividades:</strong> {d.activities}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
