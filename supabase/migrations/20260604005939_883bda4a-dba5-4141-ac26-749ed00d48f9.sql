ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cameras_quantity integer NOT NULL DEFAULT 0;

ALTER TABLE public.elderly 
  ADD COLUMN IF NOT EXISTS whatsapp_alerts_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_alerts_phone text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, cameras_quantity)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    COALESCE((new.raw_user_meta_data ->> 'cameras_quantity')::int, 0)
  );

  IF new.email IN ('admin@cuidadofacil.com', 'ramos660@hotmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN new;
END;
$function$;