import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type CareGroupRole = "responsavel" | "cuidador" | "admin_empresa";

export function useUserCareGroupRoles() {
  const { user } = useAuth();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["user-care-group-roles", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("care_group_users")
        .select("care_group_id, role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data as { care_group_id: string; role: CareGroupRole }[];
    },
    enabled: !!user,
  });

  const hasCareGroupRole = (careGroupId: string, role: CareGroupRole) =>
    roles.some((r) => r.care_group_id === careGroupId && r.role === role);

  const isResponsavel = (careGroupId: string) => hasCareGroupRole(careGroupId, "responsavel");
  const isCuidador = (careGroupId: string) => hasCareGroupRole(careGroupId, "cuidador");
  const isAdminEmpresa = (careGroupId: string) => hasCareGroupRole(careGroupId, "admin_empresa");

  const uniqueRoles = [...new Set(roles.map((r) => r.role))];

  return { roles, isLoading, hasCareGroupRole, isResponsavel, isCuidador, isAdminEmpresa, uniqueRoles };
}
