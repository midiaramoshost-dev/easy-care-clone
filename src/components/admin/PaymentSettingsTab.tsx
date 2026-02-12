import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, Eye, EyeOff, CreditCard, Loader2 } from "lucide-react";

interface GatewayConfig {
  id: string;
  gateway: string;
  public_key: string | null;
  secret_key: string | null;
  enabled: boolean;
  webhook_url: string | null;
}

const GATEWAY_LABELS: Record<string, { name: string; description: string }> = {
  stripe: {
    name: "Stripe",
    description: "Cartão de crédito e assinaturas recorrentes",
  },
  mercado_pago: {
    name: "Mercado Pago",
    description: "PIX, boleto e cartão (Brasil)",
  },
  pagseguro: {
    name: "PagSeguro",
    description: "PIX, boleto e cartão (Brasil)",
  },
};

export function PaymentSettingsTab() {
  const { toast } = useToast();
  const [gateways, setGateways] = useState<GatewayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    const { data, error } = await supabase
      .from("payment_settings")
      .select("*")
      .order("gateway");

    if (error) {
      toast({ title: "Erro", description: "Não foi possível carregar configurações.", variant: "destructive" });
    } else {
      setGateways(data || []);
    }
    setLoading(false);
  };

  const handleSave = async (gw: GatewayConfig) => {
    setSaving(gw.gateway);
    const { error } = await supabase
      .from("payment_settings")
      .update({
        public_key: gw.public_key,
        secret_key: gw.secret_key,
        enabled: gw.enabled,
        webhook_url: gw.webhook_url,
      })
      .eq("id", gw.id);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Salvo!", description: `Configurações do ${GATEWAY_LABELS[gw.gateway]?.name || gw.gateway} salvas.` });
    }
    setSaving(null);
  };

  const updateGateway = (id: string, field: keyof GatewayConfig, value: string | boolean | null) => {
    setGateways((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: value } : g))
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
      {gateways.map((gw) => {
        const label = GATEWAY_LABELS[gw.gateway] || { name: gw.gateway, description: "" };
        const isSecretVisible = showSecrets[gw.gateway] || false;

        return (
          <Card key={gw.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{label.name}</CardTitle>
                    <CardDescription>{label.description}</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={gw.enabled}
                  onCheckedChange={(checked) => updateGateway(gw.id, "enabled", checked)}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Chave Pública (Publishable Key)</Label>
                <Input
                  placeholder="pk_live_... ou APP_USR-..."
                  value={gw.public_key || ""}
                  onChange={(e) => updateGateway(gw.id, "public_key", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Chave Secreta (Secret Key)</Label>
                <div className="relative">
                  <Input
                    type={isSecretVisible ? "text" : "password"}
                    placeholder="sk_live_... ou ACCESS_TOKEN..."
                    value={gw.secret_key || ""}
                    onChange={(e) => updateGateway(gw.id, "secret_key", e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowSecrets((prev) => ({ ...prev, [gw.gateway]: !isSecretVisible }))}
                  >
                    {isSecretVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Webhook URL (opcional)</Label>
                <Input
                  placeholder="https://..."
                  value={gw.webhook_url || ""}
                  onChange={(e) => updateGateway(gw.id, "webhook_url", e.target.value)}
                />
              </div>
              <Button onClick={() => handleSave(gw)} disabled={saving === gw.gateway}>
                {saving === gw.gateway ? (
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

export default PaymentSettingsTab;
