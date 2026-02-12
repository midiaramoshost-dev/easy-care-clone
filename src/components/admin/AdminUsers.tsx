import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { usePlans } from "@/hooks/usePlans";
import { Search, Loader2, Camera, Upload, FileText, UserPlus, Shield, Eye } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface FullUser {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  created_at: string;
  roles: AppRole[];
  caregiver?: {
    specialty: string | null;
    bio: string | null;
    experience_years: number | null;
    hourly_rate: number | null;
    availability: string | null;
    active: boolean | null;
    resume_url: string | null;
    certifications: string[] | null;
  } | null;
  subscription?: {
    id: string;
    plan_id: string | null;
    status: string;
    billing_period: string;
  } | null;
}

export function AdminUsers() {
  const [users, setUsers] = useState<FullUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<FullUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [newRole, setNewRole] = useState<AppRole>("cliente");
  const [isAddingRole, setIsAddingRole] = useState(false);
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

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (profErr) throw profErr;

      const { data: roles, error: rolesErr } = await supabase.from("user_roles").select("*");
      if (rolesErr) throw rolesErr;

      const ids = (profiles || []).map((p) => p.id);

      const { data: caregivers } = await supabase.from("caregivers").select("*").in("id", ids);
      const { data: subs } = await supabase.from("subscriptions").select("*").in("user_id", ids);

      const fullUsers: FullUser[] = (profiles || []).map((p) => {
        const userRoles = (roles || []).filter((r) => r.user_id === p.id).map((r) => r.role);
        const cg = caregivers?.find((c) => c.id === p.id);
        const sub = subs?.find((s) => s.user_id === p.id);

        return {
          id: p.id,
          full_name: p.full_name,
          phone: p.phone,
          address: p.address,
          avatar_url: (p as any).avatar_url || null,
          created_at: p.created_at,
          roles: userRoles,
          caregiver: cg
            ? {
                specialty: cg.specialty,
                bio: cg.bio,
                experience_years: cg.experience_years,
                hourly_rate: cg.hourly_rate,
                availability: cg.availability,
                active: cg.active,
                resume_url: (cg as any).resume_url || null,
                certifications: cg.certifications,
              }
            : null,
          subscription: sub
            ? {
                id: sub.id,
                plan_id: sub.plan_id,
                status: sub.status,
                billing_period: sub.billing_period,
              }
            : null,
        };
      });

      setUsers(fullUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({ variant: "destructive", title: "Erro ao carregar usuários" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openEdit = (user: FullUser) => {
    setSelectedUser(user);
    setForm({
      full_name: user.full_name || "",
      phone: user.phone || "",
      address: user.address || "",
      bio: user.caregiver?.bio || "",
      specialty: user.caregiver?.specialty || "",
      experience_years: user.caregiver?.experience_years || 0,
      hourly_rate: user.caregiver?.hourly_rate || 0,
      availability: user.caregiver?.availability || "integral",
      plan_id: user.subscription?.plan_id || "",
      billing_period: user.subscription?.billing_period || "monthly",
    });
    setPhotoFile(null);
    setResumeFile(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.full_name.trim() || !selectedUser) {
      toast({ variant: "destructive", title: "Nome é obrigatório" });
      return;
    }
    setSaving(true);
    try {
      const userId = selectedUser.id;

      // Upload photo
      let avatarUrl = selectedUser.avatar_url;
      if (photoFile) {
        const path = `users/${userId}/${Date.now()}_${photoFile.name}`;
        const { error } = await supabase.storage.from("avatars").upload(path, photoFile, { upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = data.publicUrl;
      }

      // Update profile
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name,
          phone: form.phone,
          address: form.address,
          avatar_url: avatarUrl,
        })
        .eq("id", userId);
      if (profileErr) throw profileErr;

      // If user is a caregiver, update caregiver data
      if (selectedUser.roles.includes("cuidador") && selectedUser.caregiver) {
        let resumeUrl = selectedUser.caregiver.resume_url;
        if (resumeFile) {
          const path = `caregivers/${userId}/${Date.now()}_${resumeFile.name}`;
          const { error: upErr } = await supabase.storage.from("resumes").upload(path, resumeFile, { upsert: true });
          if (upErr) throw upErr;
          resumeUrl = path;
        }

        const { error: cgErr } = await supabase
          .from("caregivers")
          .update({
            bio: form.bio,
            specialty: form.specialty,
            experience_years: form.experience_years,
            hourly_rate: form.hourly_rate,
            availability: form.availability,
            avatar_url: avatarUrl,
            resume_url: resumeUrl,
          })
          .eq("id", userId);
        if (cgErr) throw cgErr;
      }

      // Manage subscription
      if (form.plan_id) {
        if (selectedUser.subscription) {
          const { error: subErr } = await supabase
            .from("subscriptions")
            .update({
              plan_id: form.plan_id,
              billing_period: form.billing_period,
              status: "active",
            })
            .eq("user_id", userId);
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

      toast({ title: "Usuário atualizado com sucesso!" });
      setDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error("Error saving:", error);
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleAddRole = async () => {
    if (!selectedUser) return;
    setIsAddingRole(true);
    try {
      const { error } = await supabase.rpc("assign_role_to_user", {
        _user_id: selectedUser.id,
        _role: newRole,
      });
      if (error) throw error;

      // If assigning cuidador role and no caregiver profile exists, create one
      if (newRole === "cuidador" && !selectedUser.caregiver) {
        await supabase.from("caregivers").insert({ id: selectedUser.id, active: true });
      }

      toast({ title: `Role "${newRole}" adicionada com sucesso!` });
      fetchUsers();
      // Update selected user in dialog
      const updated = { ...selectedUser, roles: [...selectedUser.roles, newRole] };
      setSelectedUser(updated);
    } catch (error) {
      console.error("Error adding role:", error);
      toast({ variant: "destructive", title: "Erro ao adicionar role" });
    } finally {
      setIsAddingRole(false);
    }
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

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.roles.includes(roleFilter as AppRole);
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case "admin": return "destructive" as const;
      case "cuidador": return "default" as const;
      case "cliente": return "secondary" as const;
      default: return "outline" as const;
    }
  };

  const getPlanName = (planId: string | null | undefined) => {
    if (!planId) return "Sem plano";
    return plans.find((p) => p.id === planId)?.name || "—";
  };

  const isCuidador = selectedUser?.roles.includes("cuidador");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Gerenciar Usuários</h2>
        <p className="text-muted-foreground">Cadastro completo, editável, com foto, currículo e assinatura</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, telefone ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="cuidador">Cuidador</SelectItem>
                <SelectItem value="cliente">Cliente</SelectItem>
              </SelectContent>
            </Select>
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
                  <TableHead>Telefone</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>{(user.full_name || "U")[0]}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{user.full_name || "Sem nome"}</TableCell>
                      <TableCell>{user.phone || "—"}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{user.address || "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {user.roles.length === 0 ? (
                            <Badge variant="outline">Sem role</Badge>
                          ) : (
                            user.roles.map((role) => (
                              <Badge key={role} variant={getRoleBadgeVariant(role)}>
                                {role}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.subscription ? "default" : "outline"}>
                          {getPlanName(user.subscription?.plan_id)}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>
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

      {/* Full Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Cadastro completo de {selectedUser?.full_name || "usuário"} — todos os campos são editáveis
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
              {isCuidador && <TabsTrigger value="profissional">Profissional</TabsTrigger>}
              <TabsTrigger value="assinatura">Assinatura & Roles</TabsTrigger>
            </TabsList>

            {/* Tab: Dados Pessoais */}
            <TabsContent value="dados" className="space-y-4 mt-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={photoFile ? URL.createObjectURL(photoFile) : selectedUser?.avatar_url || undefined}
                  />
                  <AvatarFallback className="text-lg">
                    <Camera className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Label>Foto de Perfil</Label>
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
                <Label>Endereço Completo</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
            </TabsContent>

            {/* Tab: Profissional (only for cuidadores) */}
            {isCuidador && (
              <TabsContent value="profissional" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Especialidade</Label>
                    <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Anos de Experiência</Label>
                    <Input
                      type="number"
                      value={form.experience_years}
                      onChange={(e) => setForm({ ...form, experience_years: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor/Hora (R$)</Label>
                    <Input
                      type="number"
                      value={form.hourly_rate}
                      onChange={(e) => setForm({ ...form, hourly_rate: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Disponibilidade</Label>
                    <Select value={form.availability} onValueChange={(v) => setForm({ ...form, availability: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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
                  <Textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* Resume Upload */}
                <div className="space-y-2 p-4 rounded-lg border border-border bg-muted/30">
                  <Label className="flex items-center gap-2">
                    <Upload className="h-4 w-4" /> Currículo (PDF, DOC)
                  </Label>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  />
                  {selectedUser?.caregiver?.resume_url && !resumeFile && (
                    <div className="flex items-center gap-2 mt-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Currículo já enviado</span>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto"
                        onClick={() => handleViewResume(selectedUser.caregiver!.resume_url!)}
                      >
                        Visualizar
                      </Button>
                    </div>
                  )}
                  {resumeFile && <p className="text-xs text-primary mt-1">Novo: {resumeFile.name}</p>}
                </div>
              </TabsContent>
            )}

            {/* Tab: Assinatura & Roles */}
            <TabsContent value="assinatura" className="space-y-4 mt-4">
              {/* Roles */}
              <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                <Label className="flex items-center gap-2 font-semibold">
                  <Shield className="h-4 w-4" /> Permissões (Roles)
                </Label>
                <div className="flex gap-1 flex-wrap">
                  {selectedUser?.roles.length === 0 ? (
                    <Badge variant="outline">Sem role</Badge>
                  ) : (
                    selectedUser?.roles.map((role) => (
                      <Badge key={role} variant={getRoleBadgeVariant(role)}>
                        {role}
                      </Badge>
                    ))
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="cuidador">Cuidador</SelectItem>
                      <SelectItem value="cliente">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleAddRole} disabled={isAddingRole}>
                    {isAddingRole ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-1" /> Adicionar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Subscription */}
              <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                <Label className="font-semibold">Plano de Assinatura</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Plano</Label>
                    <Select value={form.plan_id} onValueChange={(v) => setForm({ ...form, plan_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar plano" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - R${plan.price}
                            {plan.period || ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Período</Label>
                    <Select
                      value={form.billing_period}
                      onValueChange={(v) => setForm({ ...form, billing_period: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="annual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {selectedUser?.subscription && (
                  <p className="text-xs text-muted-foreground">
                    Status atual: <Badge variant="outline">{selectedUser.subscription.status}</Badge>
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminUsers;
