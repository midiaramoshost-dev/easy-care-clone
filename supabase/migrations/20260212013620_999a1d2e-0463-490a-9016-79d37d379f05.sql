
-- Create storage buckets for avatars and resumes
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);

-- Storage policies for avatars (public read, authenticated upload)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

-- Storage policies for resumes (admin + owner access)
CREATE POLICY "Admins can view all resumes"
ON storage.objects FOR SELECT
USING (bucket_id = 'resumes' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can upload resumes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'resumes' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own resume"
ON storage.objects FOR UPDATE
USING (bucket_id = 'resumes' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own resume"
ON storage.objects FOR DELETE
USING (bucket_id = 'resumes' AND auth.uid() IS NOT NULL);

-- Add avatar_url to profiles for client photos
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add resume_url to caregivers for CV upload
ALTER TABLE public.caregivers ADD COLUMN IF NOT EXISTS resume_url text;

-- Create subscriptions table for monthly/annual plans
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid REFERENCES public.plans(id),
  status text NOT NULL DEFAULT 'active',
  billing_period text NOT NULL DEFAULT 'monthly',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access subscriptions"
ON public.subscriptions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
