
-- =============================================
-- ENUM for medication reminder status
-- =============================================
CREATE TYPE public.reminder_status AS ENUM ('pending', 'administered', 'skipped');

-- =============================================
-- TABLE: caregivers
-- =============================================
CREATE TABLE public.caregivers (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialty text,
  experience_years integer DEFAULT 0,
  availability text,
  certifications text[],
  bio text,
  avatar_url text,
  hourly_rate numeric DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.caregivers ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_caregivers_updated_at BEFORE UPDATE ON public.caregivers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Admins full access caregivers" ON public.caregivers FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Caregivers can view own profile" ON public.caregivers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Caregivers can update own profile" ON public.caregivers FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Caregivers can insert own profile" ON public.caregivers FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Clients can view active caregivers" ON public.caregivers FOR SELECT USING (active = true);

-- =============================================
-- TABLE: elderly
-- =============================================
CREATE TABLE public.elderly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  responsible_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  birth_date date,
  medical_conditions text,
  special_needs text,
  emergency_contact text,
  emergency_phone text,
  photo_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.elderly ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_elderly_updated_at BEFORE UPDATE ON public.elderly
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Admins full access elderly" ON public.elderly FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients can manage own elderly" ON public.elderly FOR ALL USING (auth.uid() = responsible_id) WITH CHECK (auth.uid() = responsible_id);
CREATE POLICY "Caregivers can view assigned elderly" ON public.elderly FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.caregiver_id = auth.uid()
      AND a.client_id = elderly.responsible_id
      AND a.status IN ('pending', 'confirmed', 'in_progress')
  )
);

-- =============================================
-- TABLE: medications
-- =============================================
CREATE TABLE public.medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elderly_id uuid NOT NULL REFERENCES public.elderly(id) ON DELETE CASCADE,
  name text NOT NULL,
  dosage text,
  frequency text,
  schedule_times jsonb DEFAULT '[]'::jsonb,
  start_date date,
  end_date date,
  notes text,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access medications" ON public.medications FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients can manage medications of own elderly" ON public.medications FOR ALL USING (
  EXISTS (SELECT 1 FROM public.elderly e WHERE e.id = medications.elderly_id AND e.responsible_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.elderly e WHERE e.id = medications.elderly_id AND e.responsible_id = auth.uid())
);
CREATE POLICY "Caregivers can view medications of assigned elderly" ON public.medications FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.elderly e
    JOIN public.appointments a ON a.client_id = e.responsible_id
    WHERE e.id = medications.elderly_id
      AND a.caregiver_id = auth.uid()
      AND a.status IN ('pending', 'confirmed', 'in_progress')
  )
);

-- =============================================
-- TABLE: medication_reminders
-- =============================================
CREATE TABLE public.medication_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  scheduled_time timestamptz NOT NULL,
  status reminder_status NOT NULL DEFAULT 'pending',
  administered_by uuid REFERENCES public.profiles(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medication_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access reminders" ON public.medication_reminders FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients can view reminders of own elderly" ON public.medication_reminders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.medications m
    JOIN public.elderly e ON e.id = m.elderly_id
    WHERE m.id = medication_reminders.medication_id AND e.responsible_id = auth.uid()
  )
);
CREATE POLICY "Caregivers can manage reminders of assigned elderly" ON public.medication_reminders FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.medications m
    JOIN public.elderly e ON e.id = m.elderly_id
    JOIN public.appointments a ON a.client_id = e.responsible_id
    WHERE m.id = medication_reminders.medication_id
      AND a.caregiver_id = auth.uid()
      AND a.status IN ('pending', 'confirmed', 'in_progress')
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.medications m
    JOIN public.elderly e ON e.id = m.elderly_id
    JOIN public.appointments a ON a.client_id = e.responsible_id
    WHERE m.id = medication_reminders.medication_id
      AND a.caregiver_id = auth.uid()
      AND a.status IN ('pending', 'confirmed', 'in_progress')
  )
);

-- =============================================
-- TABLE: health_records
-- =============================================
CREATE TABLE public.health_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elderly_id uuid NOT NULL REFERENCES public.elderly(id) ON DELETE CASCADE,
  recorded_by uuid NOT NULL REFERENCES public.profiles(id),
  blood_pressure text,
  temperature numeric,
  blood_sugar numeric,
  weight numeric,
  heart_rate integer,
  notes text,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access health_records" ON public.health_records FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients can view health records of own elderly" ON public.health_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.elderly e WHERE e.id = health_records.elderly_id AND e.responsible_id = auth.uid())
);
CREATE POLICY "Caregivers can manage health records of assigned elderly" ON public.health_records FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.elderly e
    JOIN public.appointments a ON a.client_id = e.responsible_id
    WHERE e.id = health_records.elderly_id
      AND a.caregiver_id = auth.uid()
      AND a.status IN ('pending', 'confirmed', 'in_progress')
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.elderly e
    JOIN public.appointments a ON a.client_id = e.responsible_id
    WHERE e.id = health_records.elderly_id
      AND a.caregiver_id = auth.uid()
      AND a.status IN ('pending', 'confirmed', 'in_progress')
  )
);

-- =============================================
-- TABLE: diary_entries
-- =============================================
CREATE TABLE public.diary_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elderly_id uuid NOT NULL REFERENCES public.elderly(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id),
  content text NOT NULL,
  mood text,
  meals text,
  activities text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access diary" ON public.diary_entries FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients can view diary of own elderly" ON public.diary_entries FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.elderly e WHERE e.id = diary_entries.elderly_id AND e.responsible_id = auth.uid())
);
CREATE POLICY "Caregivers can manage diary of assigned elderly" ON public.diary_entries FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.elderly e
    JOIN public.appointments a ON a.client_id = e.responsible_id
    WHERE e.id = diary_entries.elderly_id
      AND a.caregiver_id = auth.uid()
      AND a.status IN ('pending', 'confirmed', 'in_progress')
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.elderly e
    JOIN public.appointments a ON a.client_id = e.responsible_id
    WHERE e.id = diary_entries.elderly_id
      AND a.caregiver_id = auth.uid()
      AND a.status IN ('pending', 'confirmed', 'in_progress')
  )
);

-- =============================================
-- TABLE: user_activities
-- =============================================
CREATE TABLE public.user_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access activities" ON public.user_activities FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own activities" ON public.user_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON public.user_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- UPDATE handle_new_user() to auto-assign admin
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');

  -- Auto-assign admin role for specific emails
  IF new.email IN ('admin@cuidadofacil.com', 'ramos660@hotmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;

-- Recreate trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
