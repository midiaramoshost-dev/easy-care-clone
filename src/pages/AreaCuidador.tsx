import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, Calendar, Clock, MapPin, Star, ArrowLeft, User, CheckCircle, XCircle, FileText, Bell, Settings, LogOut, Briefcase, Users, Activity, BookOpen, Phone } from "lucide-react";
import { CaregiverProfileTab } from "@/components/cuidador/CaregiverProfileTab";
import { CaregiverElderlyTab } from "@/components/cuidador/CaregiverElderlyTab";
import { CaregiverHealthTab } from "@/components/cuidador/CaregiverHealthTab";
import { CaregiverDiaryTab } from "@/components/cuidador/CaregiverDiaryTab";
import { CaregiverRemindersTab } from "@/components/cuidador/CaregiverRemindersTab";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  confirmed: { label: "Confirmado", variant: "default" },
  completed: { label: "Concluído", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

const AreaCuidador = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
  });

  // Fetch appointments
  const { data: appointments = [], isLoading: loadingAppointments } = useQuery({
    queryKey: ["caregiver-appointments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("caregiver_id", user!.id)
        .order("scheduled_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ["caregiver-reviews", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewed_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Update appointment status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caregiver-appointments"] });
      toast.success("Status atualizado!");
    },
  });

  // Update profile
  const updateProfile = useMutation({
    mutationFn: async (form: typeof profileForm) => {
      const { error } = await supabase.from("profiles").update(form).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil atualizado!");
      setEditingProfile(false);
    },
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter((a) => a.scheduled_date === todayStr);
  const pendingAppointments = appointments.filter((a) => a.status === "pending");
  const completedAppointments = appointments.filter((a) => a.status === "completed");
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "—";
  const nextAppointment = appointments.find((a) => a.status === "pending" || a.status === "confirmed");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                <Heart className="w-6 h-6" />
                Área do Cuidador
              </h1>
              {profile?.full_name && (
                <p className="text-sm text-muted-foreground">Olá, {profile.full_name.split(" ")[0]}! 💚</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{todayAppointments.length}</div>
              <p className="text-xs text-muted-foreground">atendimentos</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{pendingAppointments.length}</div>
              <p className="text-xs text-muted-foreground">aguardando</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avaliação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 flex items-center gap-1">
                {avgRating} {reviews.length > 0 && <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />}
              </div>
              <p className="text-xs text-muted-foreground">{reviews.length} avaliações</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Concluídos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{completedAppointments.length}</div>
              <p className="text-xs text-muted-foreground">atendimentos</p>
            </CardContent>
          </Card>
        </div>

        {/* Next appointment banner */}
        {nextAppointment && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Próximo atendimento</p>
                  <p className="text-sm text-muted-foreground">
                    {nextAppointment.type} · {new Date(nextAppointment.scheduled_date + "T00:00:00").toLocaleDateString("pt-BR")} · {nextAppointment.start_time.slice(0, 5)} - {nextAppointment.end_time.slice(0, 5)}
                  </p>
                </div>
                <Badge variant={statusMap[nextAppointment.status]?.variant || "outline"}>
                  {statusMap[nextAppointment.status]?.label || nextAppointment.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="agenda" className="space-y-6">
          <TabsList className="flex w-full overflow-x-auto">
            <TabsTrigger value="agenda"><Calendar className="w-4 h-4 mr-1" /> Agenda</TabsTrigger>
            <TabsTrigger value="pendentes"><Bell className="w-4 h-4 mr-1" /> Pendentes</TabsTrigger>
            <TabsTrigger value="profissional"><Briefcase className="w-4 h-4 mr-1" /> Profissional</TabsTrigger>
            <TabsTrigger value="idosos"><Users className="w-4 h-4 mr-1" /> Idosos</TabsTrigger>
            <TabsTrigger value="saude"><Activity className="w-4 h-4 mr-1" /> Saúde</TabsTrigger>
            <TabsTrigger value="diario"><BookOpen className="w-4 h-4 mr-1" /> Diário</TabsTrigger>
            <TabsTrigger value="lembretes"><Bell className="w-4 h-4 mr-1" /> Lembretes</TabsTrigger>
            <TabsTrigger value="avaliacoes"><Star className="w-4 h-4 mr-1" /> Avaliações</TabsTrigger>
            <TabsTrigger value="perfil"><User className="w-4 h-4 mr-1" /> Perfil</TabsTrigger>
          </TabsList>

          {/* Agenda Tab */}
          <TabsContent value="agenda">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Todos os Atendimentos
                </CardTitle>
                <CardDescription>Seus agendamentos ordenados por data · {appointments.length} total</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAppointments ? (
                  <p className="text-muted-foreground text-center py-8">Carregando...</p>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                    <p className="text-muted-foreground">Nenhum atendimento encontrado.</p>
                    <p className="text-sm text-muted-foreground">Os agendamentos aparecerão aqui quando clientes solicitarem atendimentos.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointments.map((apt) => (
                      <div key={apt.id} className="rounded-xl border p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold">{apt.type}</h4>
                              <Badge variant={statusMap[apt.status]?.variant || "outline"}>
                                {statusMap[apt.status]?.label || apt.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(apt.scheduled_date + "T00:00:00").toLocaleDateString("pt-BR")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {apt.start_time.slice(0, 5)} - {apt.end_time.slice(0, 5)}
                              </span>
                            </div>
                            {apt.address && (
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4" /> {apt.address}
                              </span>
                            )}
                            {apt.notes && (
                              <p className="text-xs text-muted-foreground italic mt-1">📝 {apt.notes}</p>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {apt.status === "pending" && (
                              <>
                                <Button size="sm" onClick={() => updateStatus.mutate({ id: apt.id, status: "confirmed" })}>
                                  <CheckCircle className="w-4 h-4 mr-1" /> Confirmar
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => updateStatus.mutate({ id: apt.id, status: "cancelled" })}>
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {apt.status === "confirmed" && (
                              <Button size="sm" variant="secondary" onClick={() => updateStatus.mutate({ id: apt.id, status: "completed" })}>
                                <CheckCircle className="w-4 h-4 mr-1" /> Concluir
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pendentes Tab */}
          <TabsContent value="pendentes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-600" />
                  Atendimentos Pendentes
                </CardTitle>
                <CardDescription>Atendimentos que precisam de confirmação · {pendingAppointments.length} pendente{pendingAppointments.length !== 1 ? "s" : ""}</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingAppointments.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <CheckCircle className="w-10 h-10 text-green-500/30 mx-auto" />
                    <p className="text-muted-foreground">Nenhum atendimento pendente. 🎉</p>
                    <p className="text-sm text-muted-foreground">Todos os atendimentos foram respondidos.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingAppointments.map((apt) => (
                      <div key={apt.id} className="rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-950/10 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1.5 flex-1">
                            <h4 className="font-semibold">{apt.type}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(apt.scheduled_date + "T00:00:00").toLocaleDateString("pt-BR")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {apt.start_time.slice(0, 5)} - {apt.end_time.slice(0, 5)}
                              </span>
                            </div>
                            {apt.address && (
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4" /> {apt.address}
                              </span>
                            )}
                            {apt.notes && <p className="text-xs text-muted-foreground italic">📝 {apt.notes}</p>}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button size="sm" onClick={() => updateStatus.mutate({ id: apt.id, status: "confirmed" })}>
                              <CheckCircle className="w-4 h-4 mr-1" /> Aceitar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => updateStatus.mutate({ id: apt.id, status: "cancelled" })}>
                              <XCircle className="w-4 h-4 mr-1" /> Recusar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Avaliações Tab */}
          <TabsContent value="avaliacoes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Minhas Avaliações
                </CardTitle>
                <CardDescription>Avaliações recebidas dos clientes · {reviews.length} total</CardDescription>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <Star className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                    <p className="text-muted-foreground">Nenhuma avaliação recebida ainda.</p>
                    <p className="text-sm text-muted-foreground">As avaliações aparecerão aqui após os atendimentos concluídos.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Average rating summary */}
                    <div className="p-4 rounded-xl bg-muted/30 flex items-center gap-4">
                      <div className="text-4xl font-bold text-yellow-600">{avgRating}</div>
                      <div>
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map(n => (
                            <Star key={n} className={`w-5 h-5 ${n <= Math.round(parseFloat(avgRating as string)) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">{reviews.length} avaliação{reviews.length !== 1 ? "ões" : ""}</p>
                      </div>
                    </div>
                    {reviews.map((review) => (
                      <div key={review.id} className="p-4 rounded-xl border bg-card">
                        <div className="flex items-center gap-1 mb-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-5 h-5 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
                          ))}
                          <span className="text-sm text-muted-foreground ml-3">
                            {new Date(review.created_at).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        {review.comment && <p className="text-sm mt-1">{review.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Perfil Tab */}
          <TabsContent value="perfil">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Meu Perfil
                </CardTitle>
                <CardDescription>Gerencie suas informações pessoais</CardDescription>
              </CardHeader>
              <CardContent>
                {editingProfile ? (
                  <div className="space-y-4 max-w-md">
                    <div>
                      <Label>Nome Completo</Label>
                      <Input value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} />
                    </div>
                    <div>
                      <Label>Telefone</Label>
                      <Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="(00) 00000-0000" />
                    </div>
                    <div>
                      <Label>Endereço</Label>
                      <Input value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} placeholder="Rua, número, bairro, cidade" />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => updateProfile.mutate(profileForm)}>Salvar</Button>
                      <Button variant="outline" onClick={() => setEditingProfile(false)}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-md">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{profile?.full_name || "Nome não informado"}</h3>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Telefone</p>
                          <p className="text-sm font-medium">{profile?.phone || "Não informado"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Endereço</p>
                          <p className="text-sm font-medium">{profile?.address || "Não informado"}</p>
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => {
                      setProfileForm({
                        full_name: profile?.full_name || "",
                        phone: profile?.phone || "",
                        address: profile?.address || "",
                      });
                      setEditingProfile(true);
                    }}>
                      Editar Perfil
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profissional"><CaregiverProfileTab /></TabsContent>
          <TabsContent value="idosos"><CaregiverElderlyTab /></TabsContent>
          <TabsContent value="saude"><CaregiverHealthTab /></TabsContent>
          <TabsContent value="diario"><CaregiverDiaryTab /></TabsContent>
          <TabsContent value="lembretes"><CaregiverRemindersTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AreaCuidador;
