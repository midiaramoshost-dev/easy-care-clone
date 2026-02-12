import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { usePlans } from "@/hooks/usePlans";
import { Search, Loader2, Eye, Camera, ChevronLeft, ChevronRight, Plus, UserPlus } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ClientRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  created_at: string;
  subscription?: { plan_id: string | null; status: string; billing_period: string } | null;
}

export function AdminClients() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { data: plans = [] } = usePlans();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    email: "",
    password: "",
    plan_id: "",
    billing_period: "monthly",
  });

  const fetchClients = async () => {
    setLoading(true);
    try {
      // Get users with 'cliente' role
      const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "cliente" as AppRole);
      if (rolesErr) throw rolesErr;

      const clientIds = (roles || []).map((r) => r.user_id);
      if (clientIds.length === 0) {
        setClients([]);
        setLoading(false);
        return;
      }

      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("*")
        .in("id", clientIds)
        .order("created_at", { ascending: false });
      if (profErr) throw profErr;

      const { data: subs } = await supabase
        .from("subscriptions")
        .select("user_id, plan_id, status, billing_period")
        .in("user_id", clientIds);

      const mapped: ClientRow[] = (profiles || []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        phone: p.phone,
        address: p.address,
        avatar_url: (p as any).avatar_url || null,
        created_at: p.created_at,
        subscription: subs?.find((s) => s.user_id === p.id) || null,
      }));
      setClients(mapped);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({ variant: "destructive", title: "Erro ao carregar clientes" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      toast({ variant: "destructive", title: "Nome é obrigatório" });
      return;
    }

    if (isCreating) {
      if (!form.email.trim() || !form.password.trim()) {
        toast({ variant: "destructive", title: "Email e senha são obrigatórios para novo cliente" });
        return;
      }
      setSaving(true);
      try {
        // Create user via Supabase Auth
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.full_name } },
        });
        if (authErr) throw authErr;
        if (!authData.user) throw new Error("Falha ao criar usuário");

        const userId = authData.user.id;

        // Update profile
        const { error: profileErr } = await supabase.from("profiles").update({
          full_name: form.full_name,
          phone: form.phone,
          address: form.address,
        }).eq("id", userId);
        if (profileErr) console.warn("Profile update warning:", profileErr);

        // Assign 'cliente' role
        const { error: roleErr } = await supabase.rpc("assign_role_to_user", {
          _user_id: userId,
          _role: "cliente" as AppRole,
        });
        if (roleErr) throw roleErr;

        // Handle photo
        if (photoFile) {
          const path = `clients/${userId}/${Date.now()}_${photoFile.name}`;
          const { error } = await supabase.storage.from("avatars").upload(path, photoFile, { upsert: true });
          if (!error) {
            const { data } = supabase.storage.from("avatars").getPublicUrl(path);
            await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", userId);
          }
        }

        // Create subscription if plan selected
        if (form.plan_id) {
          await supabase.from("subscriptions").insert({
            user_id: userId,
            plan_id: form.plan_id,
            billing_period: form.billing_period,
          });
        }

        toast({ title: "Cliente criado com sucesso!" });
        setDialogOpen(false);
        fetchClients();
      } catch (error: any) {
        console.error("Error creating client:", error);
        toast({ variant: "destructive", title: "Erro ao criar cliente", description: error.message });
      } finally {
        setSaving(false);
      }
      return;
    }

    // Edit existing client
    if (!selectedClient) return;
    setSaving(true);
    try {
      const userId = selectedClient.id;

      let avatarUrl = selectedClient.avatar_url;
      if (photoFile) {
        const path = `clients/${userId}/${Date.now()}_${photoFile.name}`;
        const { error } = await supabase.storage.from("avatars").upload(path, photoFile, { upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = data.publicUrl;
      }

      const { error: profileErr } = await supabase.from("profiles").update({
        full_name: form.full_name,
        phone: form.phone,
        address: form.address,
        avatar_url: avatarUrl,
      }).eq("id", userId);
      if (profileErr) throw profileErr;

      if (form.plan_id) {
        const existing = selectedClient.subscription;
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

      toast({ title: "Cliente atualizado com sucesso!" });
      setDialogOpen(false);
      fetchClients();
    } catch (error: any) {
      console.error("Error saving client:", error);
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setSelectedClient(null);
    setIsCreating(true);
    setForm({
      full_name: "",
      phone: "",
      address: "",
      email: "",
      password: "",
      plan_id: "",
      billing_period: "monthly",
    });
    setPhotoFile(null);
    setDialogOpen(true);
  };

  const openEdit = (client: ClientRow) => {
    setSelectedClient(client);
    setIsCreating(false);
    setForm({
      full_name: client.full_name || "",
      phone: client.phone || "",
      address: client.address || "",
      email: "",
      password: "",
      plan_id: client.subscription?.plan_id || "",
      billing_period: client.subscription?.billing_period || "monthly",
    });
    setPhotoFile(null);
    setDialogOpen(true);
  };

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const filteredClients = clients.filter((c) =>
    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / ITEMS_PER_PAGE));
  const paginatedClients = filteredClients.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const getPlanName = (planId: string | null | undefined) => {
    if (!planId) return "Sem plano";
    return plans.find((p) => p.id === planId)?.name || "—";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gerenciar Clientes</h2>
          <p className="text-muted-foreground">Cadastros completos com foto e assinatura</p>
        </div>
        <Button onClick={openCreate}>
          <UserPlus className="h-4 w-4 mr-2" /> Novo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou telefone..."
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
                  <TableHead>Telefone</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum cliente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={client.avatar_url || undefined} />
                          <AvatarFallback>{(client.full_name || "C")[0]}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{client.full_name || "Sem nome"}</TableCell>
                      <TableCell>{client.phone || "—"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{client.address || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={client.subscription ? "default" : "outline"}>
                          {getPlanName(client.subscription?.plan_id)}
                        </Badge>
                        {client.subscription && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({client.subscription.billing_period === "annual" ? "Anual" : "Mensal"})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{new Date(client.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(client)}>
                          <Eye className="h-4 w-4 mr-1" /> Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          {filteredClients.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredClients.length)} de {filteredClients.length}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1).map((p, idx, arr) => (
                  <span key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-muted-foreground px-1">…</span>}
                    <Button variant={p === currentPage ? "default" : "outline"} size="sm" className="w-9" onClick={() => setCurrentPage(p)}>{p}</Button>
                  </span>
                ))}
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  Próximo <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isCreating ? "Novo Cliente" : "Editar Cliente"}</DialogTitle>
            <DialogDescription>{isCreating ? "Preencha os dados para cadastrar um novo cliente" : "Cadastro completo com foto e plano de assinatura"}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Photo Upload */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={photoFile ? URL.createObjectURL(photoFile) : selectedClient?.avatar_url || undefined} />
                <AvatarFallback className="text-lg"><Camera className="h-6 w-6" /></AvatarFallback>
              </Avatar>
              <div>
                <Label>Foto do Cliente</Label>
                <Input
                  type="file"
                  accept="image/*"
                  className="mt-1"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            {isCreating && (
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border border-border bg-muted/30">
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" />
                </div>
                <div className="space-y-2">
                  <Label>Senha *</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
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

export default AdminClients;
