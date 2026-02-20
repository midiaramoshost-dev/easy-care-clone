-- Allow admins to update donations (for confirming payments)
CREATE POLICY "Admins can update donations"
  ON public.donations
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));
