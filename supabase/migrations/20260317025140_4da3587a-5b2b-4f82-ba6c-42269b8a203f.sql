
-- Drop password_hash column (the previous attempt failed due to function conflict, now resolved)
ALTER TABLE public.user_accounts DROP COLUMN IF EXISTS password_hash;

-- Update handle_new_user to not reference password_hash
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_name text;
  v_email text;
  v_phone_e164 text;
  v_provider text;
BEGIN
  v_name := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''), split_part(COALESCE(NEW.email, ''), '@', 1), 'Usuário');
  v_email := lower(NEW.email);

  v_phone_e164 := public.to_br_e164(
    COALESCE(
      NEW.raw_user_meta_data->>'phone_e164',
      NEW.raw_user_meta_data->>'phone'
    )
  );

  IF v_phone_e164 IS NULL
     AND v_email ~ '^[0-9]{10,13}@(phone\.petcao\.app|petcao\.local)$' THEN
    v_phone_e164 := public.to_br_e164(split_part(v_email, '@', 1));
  END IF;

  IF COALESCE(NEW.raw_app_meta_data->'providers', '[]'::jsonb) ? 'google'
     AND NOT (COALESCE(NEW.raw_app_meta_data->'providers', '[]'::jsonb) ? 'email') THEN
    v_provider := 'google';
  ELSE
    v_provider := 'local';
  END IF;

  INSERT INTO public.profiles (user_id, name, phone)
  VALUES (NEW.id, v_name, v_phone_e164)
  ON CONFLICT (user_id) DO UPDATE
  SET
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    updated_at = now();

  IF NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'cliente'::public.app_role);
  END IF;

  INSERT INTO public.user_accounts (id, full_name, phone_e164, email, auth_provider)
  VALUES (NEW.id, v_name, v_phone_e164, v_email, v_provider)
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = COALESCE(EXCLUDED.full_name, public.user_accounts.full_name),
    phone_e164 = COALESCE(EXCLUDED.phone_e164, public.user_accounts.phone_e164),
    email = COALESCE(EXCLUDED.email, public.user_accounts.email),
    auth_provider = CASE
      WHEN public.user_accounts.auth_provider = 'local' THEN 'local'
      ELSE EXCLUDED.auth_provider
    END,
    updated_at = now();

  RETURN NEW;
END;
$function$;

-- Also fix has_role: revoke direct RPC access from all, keep it usable only within RLS policies
-- RLS policies execute as the table owner, so they can still call has_role
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;
