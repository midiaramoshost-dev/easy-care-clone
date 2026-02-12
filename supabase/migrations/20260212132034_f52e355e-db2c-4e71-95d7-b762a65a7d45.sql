
-- Table to store payment gateway settings (keys stored securely, only admins can access)
CREATE TABLE public.payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway text NOT NULL UNIQUE,
  public_key text,
  secret_key text,
  enabled boolean NOT NULL DEFAULT false,
  webhook_url text,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage payment_settings"
ON public.payment_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_payment_settings_updated_at
BEFORE UPDATE ON public.payment_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default gateways
INSERT INTO public.payment_settings (gateway, enabled) VALUES
  ('stripe', false),
  ('mercado_pago', false),
  ('pagseguro', false);
