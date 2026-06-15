import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Plus, Trash2, Upload, Briefcase, Package, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";

type Item = { name: string; description: string; price: string; category: string };

const itemSchema = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  price: z.string().trim().max(50).optional().or(z.literal("")),
  category: z.string().trim().max(80).optional().or(z.literal("")),
});

const formSchema = z.object({
  company_name: z.string().trim().min(2, "Informe o nome da empresa").max(200),
  cnpj: z.string().trim().max(20).optional().or(z.literal("")),
  contact_name: z.string().trim().min(2, "Informe o nome do responsável").max(150),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  website: z.string().trim().max(255).optional().or(z.literal("")),
  partner_type: z.enum(["produto", "servico", "ambos"]),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

const TrabalheConosco = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [partnerType, setPartnerType] = useState<"produto" | "servico" | "ambos">("ambos");
  const [items, setItems] = useState<Item[]>([{ name: "", description: "", price: "", category: "" }]);
  const [catalogFile, setCatalogFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const addItem = () => setItems((prev) => [...prev, { name: "", description: "", price: "", category: "" }]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof Item, value: string) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));

  const uploadFile = async (file: File, folder: string) => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("partner-catalogs").upload(path, file, {
      upsert: false,
      contentType: file.type,
    });
    if (error) throw error;
    const { data } = await supabase.storage.from("partner-catalogs").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    return data?.signedUrl ?? null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fd = new FormData(e.currentTarget);
      const raw = {
        company_name: String(fd.get("company_name") || ""),
        cnpj: String(fd.get("cnpj") || ""),
        contact_name: String(fd.get("contact_name") || ""),
        email: String(fd.get("email") || ""),
        phone: String(fd.get("phone") || ""),
        website: String(fd.get("website") || ""),
        partner_type: partnerType,
        description: String(fd.get("description") || ""),
      };

      const parsed = formSchema.safeParse(raw);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message || "Dados inválidos");
        setLoading(false);
        return;
      }

      const cleanItems = items
        .map((it) => ({
          name: it.name.trim(),
          description: it.description.trim(),
          price: it.price.trim(),
          category: it.category.trim(),
        }))
        .filter((it) => it.name.length > 0)
        .map((it) => itemSchema.parse(it));

      let logo_url: string | null = null;
      let catalog_url: string | null = null;
      if (logoFile) logo_url = await uploadFile(logoFile, "logos");
      if (catalogFile) catalog_url = await uploadFile(catalogFile, "catalogs");

      const { data: auth } = await supabase.auth.getUser();

      const { error } = await supabase.from("partners").insert({
        ...parsed.data,
        items: cleanItems,
        logo_url,
        catalog_url,
        user_id: auth.user?.id ?? null,
        status: "pendente",
      });

      if (error) throw error;
      setSuccess(true);
      toast.success("Cadastro enviado! Entraremos em contato em breve.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao enviar cadastro");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container-custom mx-auto px-4 pt-32 pb-20 max-w-2xl text-center">
          <CheckCircle2 className="w-20 h-20 text-primary mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Cadastro enviado com sucesso!</h1>
          <p className="text-muted-foreground mb-8">
            Nossa equipe analisará sua proposta de parceria e entrará em contato em até 5 dias úteis.
          </p>
          <Button asChild>
            <Link to="/">Voltar para o início</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container-custom mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Briefcase className="w-4 h-4" /> Trabalhe Conosco
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Seja um <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">parceiro</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Empresas de produtos e serviços para a terceira idade podem cadastrar seu catálogo e fazer parte da rede CuidadoFácil.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados da empresa</CardTitle>
                <CardDescription>Informações para entrarmos em contato</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="company_name">Nome da empresa *</Label>
                  <Input id="company_name" name="company_name" required maxLength={200} />
                </div>
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" name="cnpj" maxLength={20} placeholder="00.000.000/0000-00" />
                </div>
                <div>
                  <Label htmlFor="website">Site</Label>
                  <Input id="website" name="website" maxLength={255} placeholder="https://" />
                </div>
                <div>
                  <Label htmlFor="contact_name">Nome do responsável *</Label>
                  <Input id="contact_name" name="contact_name" required maxLength={150} />
                </div>
                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input id="email" name="email" type="email" required maxLength={255} />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone / WhatsApp</Label>
                  <Input id="phone" name="phone" maxLength={30} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tipo de parceria</CardTitle>
                <CardDescription>O que sua empresa oferece?</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={partnerType}
                  onValueChange={(v) => setPartnerType(v as typeof partnerType)}
                  className="grid md:grid-cols-3 gap-3"
                >
                  {[
                    { v: "produto", label: "Produtos", icon: Package },
                    { v: "servico", label: "Serviços", icon: Briefcase },
                    { v: "ambos", label: "Produtos e Serviços", icon: CheckCircle2 },
                  ].map(({ v, label, icon: Icon }) => (
                    <Label
                      key={v}
                      htmlFor={`pt-${v}`}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                        partnerType === v ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <RadioGroupItem value={v} id={`pt-${v}`} />
                      <Icon className="w-5 h-5 text-primary" />
                      <span className="font-medium">{label}</span>
                    </Label>
                  ))}
                </RadioGroup>

                <div className="mt-6">
                  <Label htmlFor="description">Descrição da empresa</Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={4}
                    maxLength={2000}
                    placeholder="Conte um pouco sobre sua empresa, diferenciais e público-alvo..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Catálogo e logo</CardTitle>
                <CardDescription>Anexe seu catálogo em PDF/imagem e o logotipo</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="logo">Logotipo (PNG/JPG)</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div>
                  <Label htmlFor="catalog">Catálogo (PDF/imagem)</Label>
                  <Input
                    id="catalog"
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setCatalogFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Produtos / Serviços</CardTitle>
                  <CardDescription>Cadastre os itens que deseja divulgar (opcional)</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-1" /> Adicionar
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((it, i) => (
                  <div key={i} className="grid md:grid-cols-12 gap-2 items-start p-3 rounded-lg border bg-muted/30">
                    <Input
                      className="md:col-span-3"
                      placeholder="Nome"
                      value={it.name}
                      maxLength={150}
                      onChange={(e) => updateItem(i, "name", e.target.value)}
                    />
                    <Input
                      className="md:col-span-2"
                      placeholder="Categoria"
                      value={it.category}
                      maxLength={80}
                      onChange={(e) => updateItem(i, "category", e.target.value)}
                    />
                    <Input
                      className="md:col-span-2"
                      placeholder="Preço (opcional)"
                      value={it.price}
                      maxLength={50}
                      onChange={(e) => updateItem(i, "price", e.target.value)}
                    />
                    <Input
                      className="md:col-span-4"
                      placeholder="Descrição curta"
                      value={it.description}
                      maxLength={500}
                      onChange={(e) => updateItem(i, "description", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="md:col-span-1 text-destructive"
                      onClick={() => removeItem(i)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" asChild>
                <Link to="/">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={loading} className="bg-gradient-to-r from-primary to-accent">
                <Upload className="w-4 h-4 mr-2" />
                {loading ? "Enviando..." : "Enviar cadastro"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TrabalheConosco;
