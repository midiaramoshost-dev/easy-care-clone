import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Building2, Users, Clock, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const CompanyDashboard = () => {
  const { user } = useAuth();

  // Get companies where user is admin_empresa
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["user-companies", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("care_group_users")
        .select("care_groups(company_id, companies:company_id(id, name, cnpj, plan_type))")
        .eq("user_id", user!.id)
        .eq("role", "admin_empresa");
      if (error) throw error;

      // Extract unique companies
      const companyMap = new Map();
      data.forEach((row: any) => {
        const company = row.care_groups?.companies;
        if (company && !companyMap.has(company.id)) {
          companyMap.set(company.id, company);
        }
      });
      return Array.from(companyMap.values());
    },
    enabled: !!user,
  });

  // Get stats for first company
  const companyId = companies[0]?.id;
  const { data: stats } = useQuery({
    queryKey: ["company-stats", companyId],
    queryFn: async () => {
      const { data: careGroups } = await supabase
        .from("care_groups")
        .select("id")
        .eq("company_id", companyId)
        .eq("status", "active");
      const cgIds = careGroups?.map((cg: any) => cg.id) || [];

      const { count: totalCaregivers } = await supabase
        .from("care_group_users")
        .select("*", { count: "exact", head: true })
        .in("care_group_id", cgIds)
        .eq("role", "cuidador");

      const today = new Date().toISOString().split("T")[0];
      const { count: shiftsToday } = await supabase
        .from("shifts")
        .select("*", { count: "exact", head: true })
        .in("care_group_id", cgIds)
        .gte("start_time", `${today}T00:00:00`)
        .lte("start_time", `${today}T23:59:59`);

      return {
        totalCareGroups: cgIds.length,
        totalCaregivers: totalCaregivers || 0,
        shiftsToday: shiftsToday || 0,
      };
    },
    enabled: !!companyId,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
          </Link>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Building2 className="w-6 h-6" /> Dashboard Empresa
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <p className="text-muted-foreground text-center py-12">Carregando...</p>
        ) : companies.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-12">
              <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sem empresa vinculada</h3>
              <p className="text-muted-foreground">Você não é administrador de nenhuma empresa.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold">{companies[0].name}</h2>
              <p className="text-muted-foreground">CNPJ: {companies[0].cnpj || "Não informado"}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Grupos de Cuidado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary flex items-center gap-2">
                    <Users className="w-6 h-6" /> {stats?.totalCareGroups || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">ativos</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Cuidadores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 flex items-center gap-2">
                    <Activity className="w-6 h-6" /> {stats?.totalCaregivers || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">vinculados</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Escalas Hoje</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600 flex items-center gap-2">
                    <Clock className="w-6 h-6" /> {stats?.shiftsToday || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">agendadas</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Gestão da Empresa</CardTitle>
                <CardDescription>Funcionalidades empresariais em desenvolvimento</CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  Em breve: gestão de escalas, relatórios consolidados, controle de planos e mais.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default CompanyDashboard;
