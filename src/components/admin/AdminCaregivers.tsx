import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { usePlans } from "@/hooks/usePlans";
import { Search, UserPlus, Loader2, Upload, FileText, Eye, Camera } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface CaregiverRow {
  id: string;
  avatar_url: string | null;
  bio: string | null;
  specialty: string | null;
  certifications: string[] | null;
  experience_years: number | null;
  hourly_rate: number | null;
  availability: string | null;
  active: boolean | null;
  resume_url: string | null;
  created_at: string;
  profile?: { full_name: string | null; phone: string | null; address: string | null };
  subscription?: { plan_id: string | null; status: string; billing_period: string } | null;
}

export function AdminCaregivers() {
  const [caregivers, setCaregivers] = useState<CaregiverRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCaregiver, setSelectedCaregiver] = useState<CaregiverRow | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { data: plans = [] } = usePlans();

  // Form state
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    bio: "",
    specialty: "",
    experience_years: 0,
    hourly_rate: 0,
    availability: "integral",
    plan_id: "",
    billing_period: "monthly",
  });

  const fetchCaregivers = async () => {
    setLoading(true);
    try {
      const { data: cgs, error } = await supabase
        .from("caregivers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const ids = (cgs || []).map((c) => c.id);
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, phone, address").in("id", ids);
      const { data: subs } = await supabase.from("subscriptions").select("user_id, plan_id, status, billing_period").in("user_id", ids);

      const mapped: CaregiverRow[] = (cgs || []).map((c) => ({
        ...c,
        resume_url: (c as any).resume_url || null,
        profile: profiles?.find((p) => p.id === c.id) || undefined,
        subscription: subs?.find((s) => s.user_id === c.id) || null,
      }));
      setCaregivers(mapped);
    } catch (error) {
      console.error("Error fetching caregivers:", error);
      toast({ variant: "destructive", title: "Erro ao carregar cuidadores" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCaregivers(); }, []);

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      toast({ variant: "destructive", title: "Nome é obrigatório" });
      return;
    }
    setSaving(true);
    try {
      let userId = selectedCaregiver?.id;

      if (!userId) {
        // For new caregiver, we need an existing user. Admin creates from existing profiles.
        toast({ variant: "destructive", title: "Para criar um novo cuidador, o usuário deve primeiro se cadastrar no sistema." });
        setSaving(false);
        return;
      }

      // Upload photo if provided
      let avatarUrl = selectedCaregiver?.avatar_url;
      if (photoFile) {
        avatarUrl = await uploadFile(photoFile, "avatars", `caregivers/${userId}/${Date.now()}_${photoFile.name}`);
      }

      // Upload resume if provided
      let resumeUrl = selectedCaregiver?.resume_url;
      if (resumeFile) {
        const path = `caregivers/${userId}/${Date.now()}_${resumeFile.name}`;
        const { error: upErr } = await supabase.storage.from("resumes").upload(path, resumeFile, { upsert: true });
        if (upErr) throw upErr;
        // For private bucket, we store the path and use signed URLs
        resumeUrl = path;
      }

      // Update profile
      const { error: profileErr } = await supabase.from("profiles").update({
        full_name: form.full_name,
        phone: form.phone,
        address: form.address,
        avatar_url: avatarUrl,
      }).eq("id", userId);
      if (profileErr) throw profileErr;

      // Update caregiver
      const { error: cgErr } = await supabase.from("caregivers").update({
        bio: form.bio,
        specialty: form.specialty,
        experience_years: form.experience_years,
        hourly_rate: form.hourly_rate,
        availability: form.availability,
        avatar_url: avatarUrl,
        resume_url: resumeUrl,
      }).eq("id", userId);
      if (cgErr) throw cgErr;

      // Manage subscription
      if (form.plan_id) {
        const existing = selectedCaregiver?.subscription;
        if (existing) {
          const { error: subErr } = await supabase.from("subscriptions").update({
            plan_id: form.plan_id,
            billing_period: form.billing_period,
            status: "active",
          }).eq("user_id", userId);
          if (subErr) throw subErr;
        } else {
          const { error: subErr } = await supabase.from("subscriptions").insert({
            user_id: userId,
            plan_id: form.plan_id,
            billing_period: form.billing_period,
          });
          if (subErr) throw subErr;
        }
      }

      toast({ title: "Cuidador atualizado com sucesso!" });
      setDialogOpen(false);
      fetchCaregivers();
    } catch (error: any) {
      console.error("Error saving caregiver:", error);
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (cg: CaregiverRow) => {
    setSelectedCaregiver(cg);
    setForm({
      full_name: cg.profile?.full_name || "",
      phone: cg.profile?.phone || "",
      address: cg.profile?.address || "",
      bio: cg.bio || "",
      specialty: cg.specialty || "",
      experience_years: cg.experience_years || 0,
      hourly_rate: cg.hourly_rate || 0,
      availability: cg.availability || "integral",
      plan_id: cg.subscription?.plan_id || "",
      billing_period: cg.subscription?.billing_period || "monthly",
    });
    setPhotoFile(null);
    setResumeFile(null);
    setDialogOpen(true);
  };

  const handleViewResume = async (resumePath: string) => {
    try {
      const { data, error } = await supabase.storage.from("resumes").createSignedUrl(resumePath, 300);
      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch {
      toast({ variant: "destructive", title: "Erro ao abrir currículo" });
    }
  };

  const filteredCaregivers = caregivers.filter((cg) =>
    cg.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cg.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlanName = (planId: string | null | undefined) => {
    if (!planId) return "Sem plano";
    return plans.find((p) => p.id === planId)?.name || "—";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Gerenciar Cuidadores</h2>
        <p className="text-muted-foreground">Cadastros completos com foto, currículo e assinatura</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou especialidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Foto</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Experiência</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Currículo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCaregivers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum cuidador encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCaregivers.map((cg) => (
                    <TableRow key={cg.id}>
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={cg.avatar_url || undefined} />
                          <AvatarFallback>{(cg.profile?.full_name || "C")[0]}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{cg.profile?.full_name || "Sem nome"}</TableCell>
                      <TableCell>{cg.specialty || "—"}</TableCell>
                      <TableCell>{cg.experience_years || 0} anos</TableCell>
                      <TableCell>
                        <Badge variant={cg.subscription ? "default" : "outline"}>
                          {getPlanName(cg.subscription?.plan_id)}
                        </Badge>
                        {cg.subscription && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({cg.subscription.billing_period === "annual" ? "Anual" : "Mensal"})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {cg.resume_url ? (
                          <Button variant="ghost" size="sm" onClick={() => handleViewResume(cg.resume_url!)}>
                            <FileText className="h-4 w-4 mr-1" /> Ver
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Não enviado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={cg.active ? "default" : "secondary"}>
                          {cg.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(cg)}>
                          <Eye className="h-4 w-4 mr-1" /> Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cuidador</DialogTitle>
            <DialogDescription>Cadastro completo com foto, currículo e plano de assinatura</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Photo Upload */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={photoFile ? URL.createObjectURL(photoFile) : selectedCaregiver?.avatar_url || undefined} />
                <AvatarFallback className="text-lg"><Camera className="h-6 w-6" /></AvatarFallback>
              </Avatar>
              <div>
                <Label>Foto do Cuidador</Label>
                <Input
                  type="file"
                  accept="image/*"
                  className="mt-1"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Especialidade</Label>
                <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Anos de Experiência</Label>
                <Input type="number" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: Number(e.target.value) })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor/Hora (R$)</Label>
                <Input type="number" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Disponibilidade</Label>
                <Select value={form.availability} onValueChange={(v) => setForm({ ...form, availability: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="integral">Integral</SelectItem>
                    <SelectItem value="manhã">Manhã</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                    <SelectItem value="noite">Noite</SelectItem>
                    <SelectItem value="fins_de_semana">Fins de Semana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Biografia / Apresentação</Label>
              <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} />
            </div>

            {/* Resume Upload */}
            <div className="space-y-2 p-4 rounded-lg border border-border bg-muted/30">
              <Label className="flex items-center gap-2"><Upload className="h-4 w-4" /> Currículo (PDF, DOC)</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              />
              {selectedCaregiver?.resume_url && !resumeFile && (
                <p className="text-xs text-muted-foreground">Currículo já enviado. Envie um novo para substituir.</p>
              )}
              {resumeFile && (
                <p className="text-xs text-primary">Novo arquivo: {resumeFile.name}</p>
              )}
            </div>

            {/* Subscription */}
            <div className="space-y-2 p-4 rounded-lg border border-border bg-muted/30">
              <Label className="font-semibold">Plano de Assinatura</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-2">
                  <Label>Plano</Label>
                  <Select value={form.plan_id} onValueChange={(v) => setForm({ ...form, plan_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar plano" /></SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - R${plan.price}{plan.period || ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select value={form.billing_period} onValueChange={(v) => setForm({ ...form, billing_period: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminCaregivers;
