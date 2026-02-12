import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Activity, Clock, FileText, Heart } from "lucide-react";
import { useCareGroup } from "@/hooks/useCareGroup";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useTimeline } from "@/hooks/useTimeline";

const CareGroupDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { careGroup, members, isLoading } = useCareGroup(id || null);
  const { metrics } = useDashboardMetrics(id || null);
  const { data: timeline = [] } = useTimeline(id || null);

  const roleLabels: Record<string, string> = {
    responsavel: "Responsável",
    cuidador: "Cuidador",
    admin_empresa: "Admin Empresa",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!careGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Grupo não encontrado</h2>
          <Link to="/care-groups"><Button variant="outline">Voltar</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/care-groups">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <Heart className="w-6 h-6" /> {careGroup.name}
            </h1>
            <Badge variant={careGroup.status === "active" ? "default" : "secondary"}>
              {careGroup.status === "active" ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Membros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{metrics?.membersCount || members.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Escalas Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{metrics?.shiftsToday || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ativas Agora</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{metrics?.activeShifts || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Atividades 24h</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{metrics?.recentActivities || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="timeline" className="space-y-6">
          <TabsList>
            <TabsTrigger value="timeline"><Activity className="w-4 h-4 mr-1" /> Timeline</TabsTrigger>
            <TabsTrigger value="membros"><Users className="w-4 h-4 mr-1" /> Membros</TabsTrigger>
            <TabsTrigger value="escalas"><Clock className="w-4 h-4 mr-1" /> Escalas</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5" /> Timeline Diária</CardTitle>
                <CardDescription>Atividades recentes do grupo de cuidado</CardDescription>
              </CardHeader>
              <CardContent>
                {timeline.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhuma atividade registrada ainda.</p>
                ) : (
                  <div className="space-y-4">
                    {timeline.map((event: any) => (
                      <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">{event.title}</h4>
                            <span className="text-xs text-muted-foreground">{event.time}</span>
                          </div>
                          {event.description && <p className="text-sm text-muted-foreground mt-1">{event.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="membros">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Membros</CardTitle>
                <CardDescription>Pessoas envolvidas neste grupo de cuidado</CardDescription>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum membro.</p>
                ) : (
                  <div className="space-y-3">
                    {members.map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{m.profiles?.full_name || "Sem nome"}</p>
                          <p className="text-sm text-muted-foreground">{m.profiles?.phone || ""}</p>
                        </div>
                        <Badge variant="outline">{roleLabels[m.role] || m.role}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="escalas">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" /> Escalas</CardTitle>
                <CardDescription>Escalas de cuidadores para este grupo</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                  Módulo de escalas em desenvolvimento. Em breve você poderá criar e gerenciar turnos de cuidadores.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CareGroupDetailPage;
