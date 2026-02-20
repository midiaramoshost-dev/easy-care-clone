
-- Tabela de Instituições (asilos/beneficiárias)
CREATE TABLE public.institutions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  cnpj text,
  email text,
  phone text,
  address text,
  contact_person text,
  pix_key text,
  bank_info text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access institutions"
ON public.institutions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Tabela de Repasses
CREATE TABLE public.repasses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE RESTRICT,
  amount numeric NOT NULL CHECK (amount > 0),
  reference_month text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.repasses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access repasses"
ON public.repasses FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at em institutions
CREATE TRIGGER update_institutions_updated_at
  BEFORE UPDATE ON public.institutions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para updated_at em repasses
CREATE TRIGGER update_repasses_updated_at
  BEFORE UPDATE ON public.repasses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
