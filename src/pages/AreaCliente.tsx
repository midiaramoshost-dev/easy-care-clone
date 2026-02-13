import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { User, Calendar, Heart, Clock, Star, ArrowLeft, Phone, Plus, Settings, LogOut, MapPin, Users, Pill, Activity, BookOpen, TrendingUp, CheckCircle2 } from "lucide-react";
import { ElderlyTab } from "@/components/cliente/ElderlyTab";
import { MedicationsTab } from "@/components/cliente/MedicationsTab";
import { HealthTab } from "@/components/cliente/HealthTab";
import { DiaryTab } from "@/components/cliente/DiaryTab";
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

const AreaCliente = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingProfile, setEditingProfile] = useState(false);
  const [reviewDialog, setReviewDialog] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
  });
  const [appointmentForm, setAppointmentForm] = useState({
    scheduled_date: "",
    start_time: "",
    end_time: "",
    type: "Cuidado Diário",
    address: "",
    notes: "",
  });

  // Fetch appointments
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["client-appointments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("client_id", user!.id)
        .order("scheduled_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch elderly count
  const { data: elderlyCount = 0 } = useQuery({
    queryKey: ["elderly-count", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("elderly")
        .select("*", { count: "exact", head: true })
        .eq("responsible_id", user!.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  // Fetch reviews made by this client
  const { data: myReviews = [] } = useQuery({
    queryKey: ["client-reviews", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewer_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Create appointment
  const createAppointment = useMutation({
    mutationFn: async (form: typeof appointmentForm) => {
      const { error } = await supabase.from("appointments").insert({
        client_id: user!.id,
        caregiver_id: user!.id,
        scheduled_date: form.scheduled_date,
        start_time: form.start_time,
        end_time: form.end_time,
        type: form.type,
        address: form.address || null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-appointments"] });
      toast.success("Agendamento criado com sucesso!");
      setAppointmentForm({ scheduled_date: "", start_time: "", end_time: "", type: "Cuidado Diário", address: "", notes: "" });
    },
    onError: () => toast.error("Erro ao criar agendamento."),
  });

  // Submit review
  const submitReview = useMutation({
    mutationFn: async ({ appointmentId, rating, comment }: { appointmentId: string; rating: number; comment: string }) => {
      const apt = appointments.find((a) => a.id === appointmentId);
      if (!apt) throw new Error("Appointment not found");
      const { error } = await supabase.from("reviews").insert({
        appointment_id: appointmentId,
        reviewer_id: user!.id,
        reviewed_id: apt.caregiver_id,
        rating,
        comment: comment || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-reviews"] });
      toast.success("Avaliação enviada!");
      setReviewDialog(null);
      setReviewForm({ rating: 5, comment: "" });
    },
    onError: () => toast.error("Erro ao enviar avaliação."),
  });

  // Cancel appointment
  const cancelAppointment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-appointments"] });
      toast.success("Agendamento cancelado.");
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

  const activeAppointments = appointments.filter((a) => a.status !== "cancelled" && a.status !== "completed");
  const completedAppointments = appointments.filter((a) => a.status === "completed");
  const reviewedIds = new Set(myReviews.map((r) => r.appointment_id));
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
                <User className="w-6 h-6" />
                Área do Cliente
              </h1>
              {profile?.full_name && (
                <p className="text-sm text-muted-foreground">Olá, {profile.full_name.split(" ")[0]}! 👋</p>
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Idosos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{elderlyCount}</div>
              <p className="text-xs text-muted-foreground">cadastrados</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{appointments.length}</div>
              <p className="text-xs text-muted-foreground">agendamentos</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{activeAppointments.length}</div>
              <p className="text-xs text-muted-foreground">em andamento</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Concluídos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{completedAppointments.length}</div>
              <p className="text-xs text-muted-foreground">finalizados</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avaliações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{myReviews.length}</div>
              <p className="text-xs text-muted-foreground">enviadas</p>
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
                  <p className="text-sm font-medium">Próximo agendamento</p>
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

        <Tabs defaultValue="agendamentos" className="space-y-6">
          <TabsList className="flex w-full overflow-x-auto">
            <TabsTrigger value="agendamentos"><Calendar className="w-4 h-4 mr-1" /> Agendamentos</TabsTrigger>
            <TabsTrigger value="novo"><Plus className="w-4 h-4 mr-1" /> Novo</TabsTrigger>
            <TabsTrigger value="idosos"><Users className="w-4 h-4 mr-1" /> Idosos</TabsTrigger>
            <TabsTrigger value="medicamentos"><Pill className="w-4 h-4 mr-1" /> Medicamentos</TabsTrigger>
            <TabsTrigger value="saude"><Activity className="w-4 h-4 mr-1" /> Saúde</TabsTrigger>
            <TabsTrigger value="diario"><BookOpen className="w-4 h-4 mr-1" /> Diário</TabsTrigger>
            <TabsTrigger value="avaliacoes"><Star className="w-4 h-4 mr-1" /> Avaliações</TabsTrigger>
            <TabsTrigger value="perfil"><User className="w-4 h-4 mr-1" /> Perfil</TabsTrigger>
          </TabsList>

          {/* Agendamentos Tab */}
          <TabsContent value="agendamentos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Meus Agendamentos
                </CardTitle>
                <CardDescription>Todos os seus atendimentos · {appointments.length} total</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground text-center py-8">Carregando...</p>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                    <p className="text-muted-foreground">Nenhum agendamento encontrado.</p>
                    <p className="text-sm text-muted-foreground">Crie um novo agendamento na aba "Novo".</p>
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
                            {apt.status === "completed" && !reviewedIds.has(apt.id) && (
                              <Button size="sm" variant="outline" onClick={() => setReviewDialog(apt.id)}>
                                <Star className="w-4 h-4 mr-1" /> Avaliar
                              </Button>
                            )}
                            {(apt.status === "pending" || apt.status === "confirmed") && (
                              <Button size="sm" variant="destructive" onClick={() => cancelAppointment.mutate(apt.id)}>
                                Cancelar
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

          {/* Novo Agendamento Tab */}
          <TabsContent value="novo">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  Novo Agendamento
                </CardTitle>
                <CardDescription>Agende um novo atendimento para seus idosos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-w-lg">
                  <div>
                    <Label>Tipo de Cuidado *</Label>
                    <Select value={appointmentForm.type} onValueChange={(v) => setAppointmentForm({ ...appointmentForm, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cuidado Diário">Cuidado Diário</SelectItem>
                        <SelectItem value="Acompanhamento">Acompanhamento</SelectItem>
                        <SelectItem value="Fisioterapia">Fisioterapia</SelectItem>
                        <SelectItem value="Noturno">Noturno</SelectItem>
                        <SelectItem value="Final de Semana">Final de Semana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div>
                    <Label>Data *</Label>
                    <Input type="date" value={appointmentForm.scheduled_date} onChange={(e) => setAppointmentForm({ ...appointmentForm, scheduled_date: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Horário de Início *</Label>
                      <Input type="time" value={appointmentForm.start_time} onChange={(e) => setAppointmentForm({ ...appointmentForm, start_time: e.target.value })} />
                    </div>
                    <div>
                      <Label>Horário de Fim *</Label>
                      <Input type="time" value={appointmentForm.end_time} onChange={(e) => setAppointmentForm({ ...appointmentForm, end_time: e.target.value })} />
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <Label>Endereço do Atendimento</Label>
                    <Input value={appointmentForm.address} onChange={(e) => setAppointmentForm({ ...appointmentForm, address: e.target.value })} placeholder="Rua, número, bairro, cidade" />
                  </div>
                  <div>
                    <Label>Observações</Label>
                    <Textarea 
                      value={appointmentForm.notes} 
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })} 
                      placeholder="Informações importantes para o cuidador, preferências, restrições..."
                      rows={4}
                    />
                  </div>
                  <Button
                    onClick={() => createAppointment.mutate(appointmentForm)}
                    disabled={!appointmentForm.scheduled_date || !appointmentForm.start_time || !appointmentForm.end_time}
                    className="w-full"
                    size="lg"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Criar Agendamento
                  </Button>
                </div>
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
                <CardDescription>Avaliações que você enviou · {myReviews.length} total</CardDescription>
              </CardHeader>
              <CardContent>
                {myReviews.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <Star className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                    <p className="text-muted-foreground">Nenhuma avaliação enviada.</p>
                    <p className="text-sm text-muted-foreground">Avalie os cuidadores após a conclusão dos atendimentos.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myReviews.map((review) => (
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

          <TabsContent value="idosos"><ElderlyTab /></TabsContent>
          <TabsContent value="medicamentos"><MedicationsTab /></TabsContent>
          <TabsContent value="saude"><HealthTab /></TabsContent>
          <TabsContent value="diario"><DiaryTab /></TabsContent>
        </Tabs>

        {/* Review Dialog */}
        <Dialog open={!!reviewDialog} onOpenChange={(open) => !open && setReviewDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Avaliar Atendimento</DialogTitle>
              <DialogDescription>Deixe sua avaliação sobre o cuidador</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nota</Label>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setReviewForm({ ...reviewForm, rating: n })}>
                      <Star className={`w-8 h-8 cursor-pointer ${n <= reviewForm.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Comentário (opcional)</Label>
                <Textarea value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder="Como foi sua experiência?" rows={4} />
              </div>
              <Button
                className="w-full"
                onClick={() => reviewDialog && submitReview.mutate({ appointmentId: reviewDialog, rating: reviewForm.rating, comment: reviewForm.comment })}
              >
                Enviar Avaliação
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AreaCliente;
