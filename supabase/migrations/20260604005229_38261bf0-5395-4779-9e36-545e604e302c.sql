
-- 1. Restrict caregivers listing to authenticated users
DROP POLICY IF EXISTS "Clients can view active caregivers" ON public.caregivers;
CREATE POLICY "Authenticated users can view active caregivers"
ON public.caregivers
FOR SELECT
TO authenticated
USING (active = true);

-- 2. Restrict care_group_users self-insert to non-privileged role (cuidador)
DROP POLICY IF EXISTS "Users can add themselves to care_groups" ON public.care_group_users;
CREATE POLICY "Users can add themselves to care_groups as cuidador"
ON public.care_group_users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'cuidador'::care_group_role);

-- 3. Enforce ownership on avatar/resume update & delete via path prefix
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own resume" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own resume" ON storage.objects;

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own resume"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own resume"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
