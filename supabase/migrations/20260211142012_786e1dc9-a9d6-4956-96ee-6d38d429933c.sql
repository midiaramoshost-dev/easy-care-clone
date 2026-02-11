
-- Plans table
CREATE TABLE public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  period TEXT,
  description TEXT,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  popular BOOLEAN NOT NULL DEFAULT false,
  cta_text TEXT NOT NULL DEFAULT 'Começar',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans are publicly readable" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Admins can insert plans" ON public.plans FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update plans" ON public.plans FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete plans" ON public.plans FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.profiles(id),
  caregiver_id UUID NOT NULL REFERENCES public.profiles(id),
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own appointments" ON public.appointments FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Caregivers can view assigned appointments" ON public.appointments FOR SELECT USING (auth.uid() = caregiver_id);
CREATE POLICY "Admins can view all appointments" ON public.appointments FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Clients can create appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Admins can create appointments" ON public.appointments FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Clients can update own appointments" ON public.appointments FOR UPDATE USING (auth.uid() = client_id);
CREATE POLICY "Caregivers can update assigned appointments" ON public.appointments FOR UPDATE USING (auth.uid() = caregiver_id);
CREATE POLICY "Admins can update all appointments" ON public.appointments FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete appointments" ON public.appointments FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id),
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id),
  reviewed_id UUID NOT NULL REFERENCES public.profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviewers can insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Reviewers can view own reviews" ON public.reviews FOR SELECT USING (auth.uid() = reviewer_id);
CREATE POLICY "Reviewed can view their reviews" ON public.reviews FOR SELECT USING (auth.uid() = reviewed_id);
CREATE POLICY "Admins can view all reviews" ON public.reviews FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Contacts table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'geral',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert contacts" ON public.contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view contacts" ON public.contacts FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update contacts" ON public.contacts FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete contacts" ON public.contacts FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed plans
INSERT INTO public.plans (name, price, period, description, features, popular, cta_text, sort_order) VALUES
('Básico', 0, NULL, 'Para começar a organizar o cuidado', '["1 idoso monitorado", "Agenda básica", "Relatórios simples", "Suporte por email"]', false, 'Começar Grátis', 1),
('Família', 49, '/mês', 'Para famílias que precisam de mais recursos', '["Até 3 idosos", "Agenda completa", "Relatórios detalhados", "Alertas personalizados", "Suporte prioritário"]', true, 'Escolher Plano', 2),
('Profissional', 99, '/mês', 'Para cuidadores e profissionais de saúde', '["Idosos ilimitados", "Todas as funcionalidades", "API e integrações", "Relatórios avançados", "Suporte 24/7", "Treinamento incluso"]', false, 'Escolher Plano', 3);
