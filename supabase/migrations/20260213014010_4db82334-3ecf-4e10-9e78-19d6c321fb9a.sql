
-- Tabela para armazenar configurações de notificação (Resend, Z-API)
CREATE TABLE public.notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text NOT NULL UNIQUE, -- 'resend', 'zapi'
  api_key text,
  instance_id text, -- usado pelo Z-API
  enabled boolean NOT NULL DEFAULT false,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage notification_settings"
ON public.notification_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed com os serviços padrão
INSERT INTO public.notification_settings (service) VALUES ('resend'), ('zapi');

-- Trigger para atualizar updated_at
CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
