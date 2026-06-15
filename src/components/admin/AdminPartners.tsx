import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, X, Eye, Trash2, ExternalLink, Briefcase } from "lucide-react";
import { toast } from "sonner";

type PartnerStatus = "pendente" | "aprovado" | "rejeitado";
type PartnerType = "produto" | "servico" | "ambos";

interface Partner {
  id: string;
  company_name: string;
  cnpj: string | null;
  contact_name: string;
  email: string;
  phone: string | null;
  website: string | null;
  partner_type: PartnerType;
  description: string | null;
  logo_url: string | null;
  catalog_url: string | null;
  items: Array<{ name: string; description?: string; price?: string; category?: string }>;
  status: PartnerStatus;
  admin_notes: string | null;
  created_at: string;
}

const statusColors: Record<PartnerStatus, string> = {
  pendente: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  aprovado: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  rejeitado: "bg-destructive/10 text-destructive",
};

const AdminPartners = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Partner | null>(null);
  const [notes, setNotes] = useState("");
  const [tab, setTab] = useState<PartnerStatus | "todos">("pendente");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("partners" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setPartners((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: PartnerStatus, admin_notes?: string) => {
    const payload: any = { status };
    if (admin_notes !== undefined) payload.admin_notes = admin_notes;
    const { error } = await supabase.from("partners" as any).update(payload).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Parceiro ${status}`);
    setSelected(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir cadastro permanentemente?")) return;
    const { error } = await supabase.from("partners" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluído");
    load();
  };

  const filtered = partners.filter((p) => (tab === "todos" ? true : p.status === tab));

  const counts = {
    pendente: partners.filter((p) => p.status === "pendente").length,
    aprovado: partners.filter((p) => p.status === "aprovado").length,
    rejeitado: partners.filter((p) => p.status === "rejeitado").length,
    todos: partners.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Briefcase className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Parceiros</h1>
          <p className="text-sm text-muted-foreground">Empresas de produtos e serviços cadastradas via "Trabalhe Conosco"</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="pendente">Pendentes ({counts.pendente})</TabsTrigger>
          <TabsTrigger value="aprovado">Aprovados ({counts.aprovado})</TabsTrigger>
          <TabsTrigger value="rejeitado">Rejeitados ({counts.rejeitado})</TabsTrigger>
          <TabsTrigger value="todos">Todos ({counts.todos})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">Nenhum cadastro nesta categoria.</CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filtered.map((p) => (
                <Card key={p.id}>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {p.logo_url && (
                        <img src={p.logo_url} alt={p.company_name} className="w-12 h-12 rounded object-cover border" />
                      )}
                      <div>
                        <CardTitle className="text-lg">{p.company_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{p.contact_name} • {p.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[p.status]}>{p.status}</Badge>
                      <Badge variant="outline">{p.partner_type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelected(p);
                        setNotes(p.admin_notes || "");
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" /> Detalhes
                    </Button>
                    {p.status !== "aprovado" && (
                      <Button size="sm" onClick={() => updateStatus(p.id, "aprovado")}>
                        <Check className="w-4 h-4 mr-1" /> Aprovar
                      </Button>
                    )}
                    {p.status !== "rejeitado" && (
                      <Button size="sm" variant="secondary" onClick={() => updateStatus(p.id, "rejeitado")}>
                        <X className="w-4 h-4 mr-1" /> Rejeitar
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(p.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.company_name}</DialogTitle>
                <DialogDescription>Detalhes do cadastro</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><strong>CNPJ:</strong> {selected.cnpj || "—"}</div>
                  <div><strong>Tipo:</strong> {selected.partner_type}</div>
                  <div><strong>Contato:</strong> {selected.contact_name}</div>
                  <div><strong>E-mail:</strong> {selected.email}</div>
                  <div><strong>Telefone:</strong> {selected.phone || "—"}</div>
                  <div>
                    <strong>Site:</strong>{" "}
                    {selected.website ? (
                      <a href={selected.website} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1">
                        {selected.website} <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : "—"}
                  </div>
                </div>
                {selected.description && (
                  <div>
                    <strong>Descrição:</strong>
                    <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{selected.description}</p>
                  </div>
                )}
                {selected.catalog_url && (
                  <div>
                    <a href={selected.catalog_url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1">
                      Ver catálogo <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {selected.items && selected.items.length > 0 && (
                  <div>
                    <strong>Itens cadastrados ({selected.items.length}):</strong>
                    <div className="mt-2 space-y-2">
                      {selected.items.map((it, i) => (
                        <div key={i} className="p-2 rounded border bg-muted/30">
                          <div className="font-medium">{it.name} {it.category && <span className="text-xs text-muted-foreground">• {it.category}</span>}</div>
                          {it.price && <div className="text-xs text-primary">{it.price}</div>}
                          {it.description && <div className="text-xs text-muted-foreground">{it.description}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <Label htmlFor="notes">Observações internas</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Notas visíveis apenas para a equipe..."
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => updateStatus(selected.id, "rejeitado", notes)}>
                    <X className="w-4 h-4 mr-1" /> Rejeitar
                  </Button>
                  <Button onClick={() => updateStatus(selected.id, "aprovado", notes)}>
                    <Check className="w-4 h-4 mr-1" /> Aprovar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPartners;
