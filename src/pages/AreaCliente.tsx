import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Calendar, Heart, Clock, Star, ArrowLeft, Phone, MessageCircle, Plus, Settings, LogOut, FileText, MapPin, Users, Pill, Activity, BookOpen } from "lucide-react";
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
  const [newAppointmentOpen, setNewAppointmentOpen] = useState(false);
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
      // Use the user's own ID as caregiver placeholder (in a real app, would select a caregiver)
      const { error } = await supabase.from("appointments").insert({
        client_id: user!.id,
        caregiver_id: user!.id, // placeholder
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
      setNewAppointmentOpen(false);
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

  const activeAppointments = appointments.filter((a) => a.status !== "cancelled");
  const completedAppointments = appointments.filter((a) => a.status === "completed");
  const reviewedIds = new Set(myReviews.map((r) => r.appointment_id));

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
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <User className="w-6 h-6" />
              Área do Cliente
            </h1>
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

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{appointments.length}</div>
              <p className="text-xs text-muted-foreground">agendamentos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{activeAppointments.filter((a) => a.status !== "completed").length}</div>
              <p className="text-xs text-muted-foreground">em andamento</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Concluídos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{completedAppointments.length}</div>
              <p className="text-xs text-muted-foreground">finalizados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avaliações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{myReviews.length}</div>
              <p className="text-xs text-muted-foreground">enviadas</p>
            </CardContent>
          </Card>
        </div>

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
                <CardDescription>Todos os seus atendimentos</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground text-center py-8">Carregando...</p>
                ) : appointments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum agendamento encontrado. Crie um novo!</p>
                ) : (
                  <div className="space-y-3">
                    {appointments.map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
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
                        </div>
                        <div className="flex gap-2">
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
                <CardDescription>Agende um novo atendimento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-w-md">
                  <div>
                    <Label>Tipo de Cuidado</Label>
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
                  <div>
                    <Label>Data</Label>
                    <Input type="date" value={appointmentForm.scheduled_date} onChange={(e) => setAppointmentForm({ ...appointmentForm, scheduled_date: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Início</Label>
                      <Input type="time" value={appointmentForm.start_time} onChange={(e) => setAppointmentForm({ ...appointmentForm, start_time: e.target.value })} />
                    </div>
                    <div>
                      <Label>Fim</Label>
                      <Input type="time" value={appointmentForm.end_time} onChange={(e) => setAppointmentForm({ ...appointmentForm, end_time: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Endereço</Label>
                    <Input value={appointmentForm.address} onChange={(e) => setAppointmentForm({ ...appointmentForm, address: e.target.value })} placeholder="Rua, número, bairro" />
                  </div>
                  <div>
                    <Label>Observações</Label>
                    <Textarea value={appointmentForm.notes} onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })} placeholder="Informações adicionais..." />
                  </div>
                  <Button
                    onClick={() => createAppointment.mutate(appointmentForm)}
                    disabled={!appointmentForm.scheduled_date || !appointmentForm.start_time || !appointmentForm.end_time}
                    className="w-full"
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
                <CardDescription>Avaliações que você enviou</CardDescription>
              </CardHeader>
              <CardContent>
                {myReviews.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhuma avaliação enviada. Avalie após a conclusão de um atendimento.</p>
                ) : (
                  <div className="space-y-4">
                    {myReviews.map((review) => (
                      <div key={review.id} className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-1 mb-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                          ))}
                          <span className="text-sm text-muted-foreground ml-2">
                            {new Date(review.created_at).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        {review.comment && <p className="text-sm">{review.comment}</p>}
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
                      <Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
                    </div>
                    <div>
                      <Label>Endereço</Label>
                      <Input value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => updateProfile.mutate(profileForm)}>Salvar</Button>
                      <Button variant="outline" onClick={() => setEditingProfile(false)}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-md">
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium">{user?.email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Nome</Label>
                      <p className="font-medium">{profile?.full_name || "Não informado"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Telefone</Label>
                      <p className="font-medium">{profile?.phone || "Não informado"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Endereço</Label>
                      <p className="font-medium">{profile?.address || "Não informado"}</p>
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
                <Textarea value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder="Como foi sua experiência?" />
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
