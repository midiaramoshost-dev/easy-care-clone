import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit, Trash2, Star, GripVertical, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface PlanForm {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string;
  popular: boolean;
  cta_text: string;
  sort_order: string;
  active: boolean;
}

const emptyForm: PlanForm = {
  name: "", price: "0", period: "/mês", description: "", features: "",
  popular: false, cta_text: "Começar", sort_order: "0", active: true,
};

export function AdminPlansTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const featuresArray = form.features.split("\n").map(f => f.trim()).filter(Boolean);
      const payload = {
        name: form.name,
        price: parseFloat(form.price) || 0,
        period: form.period || null,
        description: form.description || null,
        features: featuresArray,
        popular: form.popular,
        cta_text: form.cta_text || "Começar",
        sort_order: parseInt(form.sort_order) || 0,
        active: form.active,
      };
      if (editingId) {
        const { error } = await supabase.from("plans").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("plans").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast.success(editingId ? "Plano atualizado!" : "Plano criado!");
      resetForm();
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Plano excluído.");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(false);
  };

  const startEdit = (p: any) => {
    const features = Array.isArray(p.features) ? (p.features as string[]).join("\n") : "";
    setForm({
      name: p.name,
      price: p.price?.toString() || "0",
      period: p.period || "",
      description: p.description || "",
      features,
      popular: p.popular || false,
      cta_text: p.cta_text || "Começar",
      sort_order: p.sort_order?.toString() || "0",
      active: p.active ?? true,
    });
    setEditingId(p.id);
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <div>
          <CardTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-primary" /> Gerenciar Planos</CardTitle>
          <CardDescription>Crie, edite e exclua planos exibidos na landing page · {plans.length} plano{plans.length !== 1 ? "s" : ""}</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Plano</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Plano" : "Novo Plano"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Básico, Família, Profissional" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Preço (R$)</Label>
                  <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div>
                  <Label>Período</Label>
                  <Input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="/mês" />
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Breve descrição do plano" />
              </div>
              <div>
                <Label>Funcionalidades (uma por linha)</Label>
                <Textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder={"1 idoso monitorado\nAgenda básica\nRelatórios simples"} rows={5} />
              </div>
              <div>
                <Label>Texto do Botão (CTA)</Label>
                <Input value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} placeholder="Começar Grátis" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Ordem de exibição</Label>
                  <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Destacar como Popular</Label>
                  <p className="text-xs text-muted-foreground">Exibe badge "Popular" no plano</p>
                </div>
                <Switch checked={form.popular} onCheckedChange={(v) => setForm({ ...form, popular: v })} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Ativo</Label>
                  <p className="text-xs text-muted-foreground">Planos inativos não aparecem na landing page</p>
                </div>
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              </div>
              <Button className="w-full" disabled={!form.name} onClick={() => upsert.mutate()}>
                {editingId ? "Salvar Alterações" : "Criar Plano"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-muted-foreground text-center py-8">Carregando...</p> :
         plans.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Star className="w-10 h-10 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">Nenhum plano cadastrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((p: any) => {
              const features = Array.isArray(p.features) ? p.features as string[] : [];
              return (
                <div key={p.id} className={`rounded-xl border p-4 ${!p.active ? "opacity-50" : ""} ${p.popular ? "border-primary/50 bg-primary/5" : "bg-card"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-lg">{p.name}</h4>
                        {p.popular && <Badge>Popular</Badge>}
                        {!p.active && <Badge variant="secondary">Inativo</Badge>}
                        <span className="text-sm text-muted-foreground">Ordem: {p.sort_order}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">R$ {p.price}</span>
                        {p.period && <span className="text-sm text-muted-foreground">{p.period}</span>}
                      </div>
                      {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                      {features.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {features.map((f, i) => (
                            <span key={i} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                              <Check className="w-3 h-3 text-green-600" /> {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(p)}><Edit className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => remove.mutate(p.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
