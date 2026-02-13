import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, Eye, EyeOff, Mail, MessageSquare, Loader2 } from "lucide-react";

interface NotifConfig {
  id: string;
  service: string;
  api_key: string | null;
  instance_id: string | null;
  enabled: boolean;
}

const SERVICE_LABELS: Record<string, { name: string; description: string; icon: React.ElementType }> = {
  resend: {
    name: "Resend (Email)",
    description: "Envio de cobranças e notificações por email",
    icon: Mail,
  },
  zapi: {
    name: "Z-API (WhatsApp)",
    description: "Envio de cobranças e notificações via WhatsApp",
    icon: MessageSquare,
  },
};

export function NotificationSettingsTab() {
  const { toast } = useToast();
  const [services, setServices] = useState<NotifConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("notification_settings")
      .select("id, service, api_key, instance_id, enabled")
      .order("service");

    if (error) {
      toast({ title: "Erro", description: "Não foi possível carregar configurações.", variant: "destructive" });
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  const handleSave = async (svc: NotifConfig) => {
    setSaving(svc.service);
    const { error } = await supabase
      .from("notification_settings")
      .update({
        api_key: svc.api_key,
        instance_id: svc.instance_id,
        enabled: svc.enabled,
      })
      .eq("id", svc.id);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Salvo!", description: `Configurações do ${SERVICE_LABELS[svc.service]?.name || svc.service} salvas.` });
    }
    setSaving(null);
  };

  const updateService = (id: string, field: keyof NotifConfig, value: string | boolean | null) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {services.map((svc) => {
        const label = SERVICE_LABELS[svc.service] || { name: svc.service, description: "", icon: Mail };
        const Icon = label.icon;
        const isSecretVisible = showSecrets[svc.service] || false;

        return (
          <Card key={svc.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{label.name}</CardTitle>
                    <CardDescription>{label.description}</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={svc.enabled}
                  onCheckedChange={(checked) => updateService(svc.id, "enabled", checked)}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>API Key / Token</Label>
                <div className="relative">
                  <Input
                    type={isSecretVisible ? "text" : "password"}
                    placeholder={svc.service === "resend" ? "re_..." : "Token do Z-API"}
                    value={svc.api_key || ""}
                    onChange={(e) => updateService(svc.id, "api_key", e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowSecrets((prev) => ({ ...prev, [svc.service]: !isSecretVisible }))}
                  >
                    {isSecretVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {svc.service === "zapi" && (
                <div className="space-y-2">
                  <Label>Instance ID</Label>
                  <Input
                    placeholder="ID da instância Z-API"
                    value={svc.instance_id || ""}
                    onChange={(e) => updateService(svc.id, "instance_id", e.target.value)}
                  />
                </div>
              )}

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {svc.service === "resend"
                    ? "Obtenha sua API Key em resend.com/api-keys. Adicione e verifique seu domínio no painel do Resend."
                    : "Obtenha seu Token e Instance ID em z-api.io. Conecte seu WhatsApp na plataforma Z-API."}
                </p>
              </div>

              <Button onClick={() => handleSave(svc)} disabled={saving === svc.service}>
                {saving === svc.service ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar {label.name}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
