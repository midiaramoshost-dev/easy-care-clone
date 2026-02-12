import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useDashboardMetrics(careGroupId: string | null) {
  const { user } = useAuth();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["dashboard-metrics", careGroupId],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];

      // Get shifts for today
      const { data: shiftsToday } = await supabase
        .from("shifts")
        .select("*", { count: "exact", head: false })
        .eq("care_group_id", careGroupId!)
        .gte("start_time", `${today}T00:00:00`)
        .lte("start_time", `${today}T23:59:59`);

      // Get members count
      const { count: membersCount } = await supabase
        .from("care_group_users")
        .select("*", { count: "exact", head: true })
        .eq("care_group_id", careGroupId!);

      // Get recent audit logs count (last 24h)
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      const { count: recentActivities } = await supabase
        .from("audit_logs")
        .select("*", { count: "exact", head: true })
        .eq("care_group_id", careGroupId!)
        .gte("created_at", yesterday);

      return {
        shiftsToday: shiftsToday?.length || 0,
        membersCount: membersCount || 0,
        recentActivities: recentActivities || 0,
        activeShifts: shiftsToday?.filter((s: any) => s.status === "active").length || 0,
      };
    },
    enabled: !!careGroupId && !!user,
  });

  return { metrics, isLoading };
}

export function useCompanyDashboardMetrics(companyId: string | null) {
  const { user } = useAuth();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["company-dashboard-metrics", companyId],
    queryFn: async () => {
      // Get all care_groups for this company
      const { data: careGroups } = await supabase
        .from("care_groups")
        .select("id")
        .eq("company_id", companyId!)
        .eq("status", "active");

      const cgIds = careGroups?.map((cg: any) => cg.id) || [];

      // Get total caregivers across all care_groups
      const { count: totalCaregivers } = await supabase
        .from("care_group_users")
        .select("*", { count: "exact", head: true })
        .in("care_group_id", cgIds)
        .eq("role", "cuidador");

      // Get today's shifts
      const today = new Date().toISOString().split("T")[0];
      const { data: shiftsToday } = await supabase
        .from("shifts")
        .select("*")
        .in("care_group_id", cgIds)
        .gte("start_time", `${today}T00:00:00`)
        .lte("start_time", `${today}T23:59:59`);

      return {
        totalCareGroups: cgIds.length,
        totalCaregivers: totalCaregivers || 0,
        shiftsToday: shiftsToday?.length || 0,
        activeShifts: shiftsToday?.filter((s: any) => s.status === "active").length || 0,
      };
    },
    enabled: !!companyId && !!user,
  });

  return { metrics, isLoading };
}
