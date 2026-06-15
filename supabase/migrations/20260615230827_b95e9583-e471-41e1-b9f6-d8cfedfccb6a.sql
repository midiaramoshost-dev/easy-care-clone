
-- Tighten audit_logs INSERT to require non-null user_id
DROP POLICY IF EXISTS "Authenticated users can insert audit_logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit_logs"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);

-- Enforce path-based ownership on avatar uploads
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Enforce path-based ownership on resume uploads
DROP POLICY IF EXISTS "Authenticated users can upload resumes" ON storage.objects;
CREATE POLICY "Authenticated users can upload resumes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'resumes'
  AND auth.uid() IS NOT NULL
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Tighten public contacts insert policy with basic validation (instead of WITH CHECK true)
DROP POLICY IF EXISTS "Anyone can insert contacts" ON public.contacts;
CREATE POLICY "Anyone can insert contacts"
ON public.contacts FOR INSERT
WITH CHECK (
  length(name) BETWEEN 1 AND 200
  AND length(email) BETWEEN 3 AND 255
  AND email LIKE '%_@_%.__%'
  AND length(message) BETWEEN 1 AND 5000
  AND length(type) BETWEEN 1 AND 50
  AND (phone IS NULL OR length(phone) <= 50)
);
