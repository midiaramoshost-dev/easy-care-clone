import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type AuditActionType = "CREATE" | "UPDATE" | "DELETE";

export function useAuditLog() {
  const { user } = useAuth();

  const logAction = useMutation({
    mutationFn: async ({
      careGroupId,
      actionType,
      entityType,
      entityId,
      details,
    }: {
      careGroupId: string;
      actionType: AuditActionType;
      entityType: string;
      entityId?: string;
      details?: string;
    }) => {
      const { error } = await supabase.from("audit_logs").insert({
        user_id: user?.id || null,
        care_group_id: careGroupId,
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId || null,
        details: details || null,
      });
      if (error) throw error;
    },
  });

  return { logAction: logAction.mutate, isLogging: logAction.isPending };
}
