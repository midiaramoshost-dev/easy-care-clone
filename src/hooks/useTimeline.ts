import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TimelineEvent {
  id: string;
  type: "diary" | "health" | "medication" | "shift";
  title: string;
  description: string;
  author: string;
  time: string;
  created_at: string;
}

export function useTimeline(careGroupId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["timeline", careGroupId],
    queryFn: async (): Promise<TimelineEvent[]> => {
      if (!careGroupId) return [];

      // Get elderly linked to this care group's responsible users
      // For now, fetch audit_logs for this care_group as timeline
      const { data: logs, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("care_group_id", careGroupId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      return (logs || []).map((log: any) => ({
        id: log.id,
        type: log.entity_type as TimelineEvent["type"],
        title: `${log.action_type} ${log.entity_type}`,
        description: log.details || "",
        author: log.user_id || "Sistema",
        time: new Date(log.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        created_at: log.created_at,
      }));
    },
    enabled: !!careGroupId && !!user,
  });
}
