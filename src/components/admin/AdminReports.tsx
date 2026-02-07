import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export function AdminReports() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Relatórios</h2>
        <p className="text-muted-foreground">
          Análises e métricas de desempenho
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Em Desenvolvimento
          </CardTitle>
          <CardDescription>
            Esta funcionalidade está sendo desenvolvida
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Módulo de Relatórios</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Em breve você poderá gerar relatórios detalhados sobre o desempenho
              do sistema, incluindo métricas de atendimento, satisfação e financeiras.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminReports;
