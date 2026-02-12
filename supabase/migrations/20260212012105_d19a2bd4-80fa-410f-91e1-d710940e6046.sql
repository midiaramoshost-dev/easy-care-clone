
-- =============================================
-- FASE 1: Enums e Tabelas Multi-Tenant
-- =============================================

-- Enum para tipo de plano de empresa
CREATE TYPE public.company_plan_type AS ENUM ('basic', 'premium', 'professional', 'enterprise');

-- Enum para role dentro de care_group
CREATE TYPE public.care_group_role AS ENUM ('responsavel', 'cuidador', 'admin_empresa');

-- Enum para status de shift
CREATE TYPE public.shift_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');

-- Enum para tipo de ação de auditoria
CREATE TYPE public.audit_action_type AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- =============================================
-- 1) companies
-- =============================================
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT,
  plan_type public.company_plan_type NOT NULL DEFAULT 'basic',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2) care_groups
-- =============================================
CREATE TABLE public.care_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.care_groups ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 3) care_group_users (junction table)
-- =============================================
CREATE TABLE public.care_group_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_group_id UUID NOT NULL REFERENCES public.care_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.care_group_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (care_group_id, user_id, role)
);

ALTER TABLE public.care_group_users ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4) audit_logs
-- =============================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  care_group_id UUID REFERENCES public.care_groups(id) ON DELETE SET NULL,
  action_type public.audit_action_type NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  ip_address TEXT,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5) shifts (para empresas)
-- =============================================
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_group_id UUID NOT NULL REFERENCES public.care_groups(id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status public.shift_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6) checkins
-- =============================================
CREATE TABLE public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Security Definer Functions
-- =============================================

-- Check if user belongs to a care_group
CREATE OR REPLACE FUNCTION public.is_care_group_member(_user_id UUID, _care_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.care_group_users
    WHERE user_id = _user_id AND care_group_id = _care_group_id
  )
$$;

-- Check if user has a specific role in a care_group
CREATE OR REPLACE FUNCTION public.has_care_group_role(_user_id UUID, _care_group_id UUID, _role care_group_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.care_group_users
    WHERE user_id = _user_id AND care_group_id = _care_group_id AND role = _role
  )
$$;

-- Check if user belongs to a company (via any care_group)
CREATE OR REPLACE FUNCTION public.is_company_member(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.care_group_users cgu
    JOIN public.care_groups cg ON cg.id = cgu.care_group_id
    WHERE cgu.user_id = _user_id AND cg.company_id = _company_id
  )
$$;

-- Check if user is admin_empresa for a company
CREATE OR REPLACE FUNCTION public.is_company_admin(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.care_group_users cgu
    JOIN public.care_groups cg ON cg.id = cgu.care_group_id
    WHERE cgu.user_id = _user_id AND cg.company_id = _company_id AND cgu.role = 'admin_empresa'
  )
$$;

-- =============================================
-- RLS Policies: companies
-- =============================================
CREATE POLICY "Admins full access companies"
  ON public.companies FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Company members can view their company"
  ON public.companies FOR SELECT
  USING (public.is_company_member(auth.uid(), id));

CREATE POLICY "Company admins can update their company"
  ON public.companies FOR UPDATE
  USING (public.is_company_admin(auth.uid(), id));

-- =============================================
-- RLS Policies: care_groups
-- =============================================
CREATE POLICY "Admins full access care_groups"
  ON public.care_groups FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Members can view their care_groups"
  ON public.care_groups FOR SELECT
  USING (public.is_care_group_member(auth.uid(), id));

CREATE POLICY "Company admins can manage care_groups"
  ON public.care_groups FOR ALL
  USING (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id));

CREATE POLICY "Authenticated users can create care_groups"
  ON public.care_groups FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- RLS Policies: care_group_users
-- =============================================
CREATE POLICY "Admins full access care_group_users"
  ON public.care_group_users FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Members can view care_group_users of their groups"
  ON public.care_group_users FOR SELECT
  USING (public.is_care_group_member(auth.uid(), care_group_id));

CREATE POLICY "Responsavel can manage care_group_users"
  ON public.care_group_users FOR ALL
  USING (public.has_care_group_role(auth.uid(), care_group_id, 'responsavel'));

CREATE POLICY "Company admins can manage care_group_users"
  ON public.care_group_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.care_groups cg
      WHERE cg.id = care_group_users.care_group_id
        AND cg.company_id IS NOT NULL
        AND public.is_company_admin(auth.uid(), cg.company_id)
    )
  );

CREATE POLICY "Users can add themselves to care_groups"
  ON public.care_group_users FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- RLS Policies: audit_logs
-- =============================================
CREATE POLICY "Admins full access audit_logs"
  ON public.audit_logs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Members can view audit_logs of their care_groups"
  ON public.audit_logs FOR SELECT
  USING (care_group_id IS NOT NULL AND public.is_care_group_member(auth.uid(), care_group_id));

CREATE POLICY "Authenticated users can insert audit_logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- RLS Policies: shifts
-- =============================================
CREATE POLICY "Admins full access shifts"
  ON public.shifts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Members can view shifts of their care_groups"
  ON public.shifts FOR SELECT
  USING (public.is_care_group_member(auth.uid(), care_group_id));

CREATE POLICY "Company admins can manage shifts"
  ON public.shifts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.care_groups cg
      WHERE cg.id = shifts.care_group_id
        AND cg.company_id IS NOT NULL
        AND public.is_company_admin(auth.uid(), cg.company_id)
    )
  );

CREATE POLICY "Responsavel can manage shifts in their care_groups"
  ON public.shifts FOR ALL
  USING (public.has_care_group_role(auth.uid(), care_group_id, 'responsavel'));

CREATE POLICY "Caregivers can update own shifts"
  ON public.shifts FOR UPDATE
  USING (auth.uid() = caregiver_id);

-- =============================================
-- RLS Policies: checkins
-- =============================================
CREATE POLICY "Admins full access checkins"
  ON public.checkins FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Members can view checkins of their care_groups"
  ON public.checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shifts s
      WHERE s.id = checkins.shift_id
        AND public.is_care_group_member(auth.uid(), s.care_group_id)
    )
  );

CREATE POLICY "Caregivers can insert own checkins"
  ON public.checkins FOR INSERT
  WITH CHECK (auth.uid() = caregiver_id);

-- =============================================
-- Triggers: updated_at
-- =============================================
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_care_groups_updated_at
  BEFORE UPDATE ON public.care_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at
  BEFORE UPDATE ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
