import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export function AdminSchedules() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Agendamentos</h2>
        <p className="text-muted-foreground">
          Visualize e gerencie todos os agendamentos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Em Desenvolvimento
          </CardTitle>
          <CardDescription>
            Esta funcionalidade está sendo desenvolvida
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Módulo de Agendamentos</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Em breve você poderá visualizar, criar e gerenciar todos os agendamentos
              de atendimentos diretamente por aqui.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminSchedules;
