import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useCareGroups() {
  const { user } = useAuth();

  const { data: careGroups = [], isLoading, refetch } = useQuery({
    queryKey: ["care-groups", user?.id],
    queryFn: async () => {
      // Get care_groups where the user is a member
      const { data, error } = await supabase
        .from("care_group_users")
        .select("care_group_id, role, care_groups(id, name, status, company_id, created_at, updated_at)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data.map((row: any) => ({
        ...row.care_groups,
        userRole: row.role,
      }));
    },
    enabled: !!user,
  });

  return { careGroups, isLoading, refetch };
}

export function useCareGroup(careGroupId: string | null) {
  const { user } = useAuth();

  const { data: careGroup, isLoading } = useQuery({
    queryKey: ["care-group", careGroupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("care_groups")
        .select("*")
        .eq("id", careGroupId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!careGroupId && !!user,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["care-group-members", careGroupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("care_group_users")
        .select("*, profiles:user_id(id, full_name, phone)")
        .eq("care_group_id", careGroupId!);
      if (error) throw error;
      return data;
    },
    enabled: !!careGroupId && !!user,
  });

  return { careGroup, members, isLoading };
}

export function useCreateCareGroup() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, companyId }: { name: string; companyId?: string }) => {
      // Create the care group
      const { data: cg, error } = await supabase
        .from("care_groups")
        .insert({ name, company_id: companyId || null })
        .select()
        .single();
      if (error) throw error;

      // Add creator as responsavel
      const { error: memberError } = await supabase
        .from("care_group_users")
        .insert({ care_group_id: cg.id, user_id: user!.id, role: "responsavel" });
      if (memberError) throw memberError;

      return cg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["care-groups"] });
      toast.success("Grupo de cuidado criado!");
    },
    onError: () => toast.error("Erro ao criar grupo de cuidado."),
  });
}

export function useAddCareGroupMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ careGroupId, userId, role }: { careGroupId: string; userId: string; role: string }) => {
      const { error } = await supabase
        .from("care_group_users")
        .insert({ care_group_id: careGroupId, user_id: userId, role: role as any });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["care-group-members", vars.careGroupId] });
      toast.success("Membro adicionado!");
    },
    onError: () => toast.error("Erro ao adicionar membro."),
  });
}
