
-- Tabela para registrar doações aos asilos de Sorocaba
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_name TEXT NOT NULL,
  donor_email TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 2.00),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a donation (public action)
CREATE POLICY "Anyone can create donations"
ON public.donations
FOR INSERT
WITH CHECK (amount >= 2.00);

-- Only admins can view donations
CREATE POLICY "Admins can view donations"
ON public.donations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
