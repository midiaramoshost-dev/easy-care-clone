
CREATE TYPE public.partner_type AS ENUM ('produto', 'servico', 'ambos');
CREATE TYPE public.partner_status AS ENUM ('pendente', 'aprovado', 'rejeitado');

CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  cnpj TEXT,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  partner_type public.partner_type NOT NULL DEFAULT 'ambos',
  description TEXT,
  logo_url TEXT,
  catalog_url TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status public.partner_status NOT NULL DEFAULT 'pendente',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.partners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit partner application"
ON public.partners FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'pendente');

CREATE POLICY "Public can view approved partners"
ON public.partners FOR SELECT
TO anon, authenticated
USING (status = 'aprovado');

CREATE POLICY "Owners can view own partner record"
ON public.partners FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Owners can update own partner record"
ON public.partners FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND status = 'pendente');

CREATE POLICY "Admins can view all partners"
ON public.partners FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all partners"
ON public.partners FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete partners"
ON public.partners FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_partners_updated_at
BEFORE UPDATE ON public.partners
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for partner-catalogs bucket
CREATE POLICY "Anyone can read partner catalog files"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'partner-catalogs');

CREATE POLICY "Anyone can upload partner catalog files"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'partner-catalogs');

CREATE POLICY "Admins manage partner catalog files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'partner-catalogs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete partner catalog files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'partner-catalogs' AND public.has_role(auth.uid(), 'admin'));
