-- 1) Helpers de normalização
CREATE OR REPLACE FUNCTION public.to_br_e164(raw text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  digits text;
BEGIN
  digits := regexp_replace(COALESCE(raw, ''), '\D', '', 'g');
  IF digits = '' THEN
    RETURN NULL;
  END IF;

  -- Entrada com DDI 55 (12 ou 13 dígitos totais)
  IF left(digits, 2) = '55' AND length(digits) IN (12, 13) THEN
    digits := substring(digits FROM 3);
  END IF;

  -- BR nacional com DDD: 10 ou 11
  IF length(digits) NOT IN (10, 11) THEN
    RETURN NULL;
  END IF;

  RETURN '+55' || digits;
END;
$$;

-- 2) Tabela única de contas para lookup consistente
CREATE TABLE IF NOT EXISTS public.user_accounts (
  id uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  phone_e164 text NULL,
  email text NULL,
  password_hash text NULL,
  auth_provider text NOT NULL DEFAULT 'local',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_accounts_auth_provider_check CHECK (auth_provider IN ('local', 'google'))
);

CREATE UNIQUE INDEX IF NOT EXISTS user_accounts_phone_e164_key
  ON public.user_accounts (phone_e164)
  WHERE phone_e164 IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS user_accounts_email_lower_key
  ON public.user_accounts ((lower(email)))
  WHERE email IS NOT NULL;

ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_accounts'
      AND policyname = 'Users can read own user_accounts'
  ) THEN
    CREATE POLICY "Users can read own user_accounts"
      ON public.user_accounts
      FOR SELECT
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_accounts'
      AND policyname = 'Users can insert own user_accounts'
  ) THEN
    CREATE POLICY "Users can insert own user_accounts"
      ON public.user_accounts
      FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_accounts'
      AND policyname = 'Users can update own user_accounts'
  ) THEN
    CREATE POLICY "Users can update own user_accounts"
      ON public.user_accounts
      FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_accounts'
      AND policyname = 'Devs can manage user_accounts'
  ) THEN
    CREATE POLICY "Devs can manage user_accounts"
      ON public.user_accounts
      FOR ALL
      USING (public.has_role(auth.uid(), 'dev'::public.app_role))
      WITH CHECK (public.has_role(auth.uid(), 'dev'::public.app_role));
  END IF;
END
$$;

DROP TRIGGER IF EXISTS update_user_accounts_updated_at ON public.user_accounts;
CREATE TRIGGER update_user_accounts_updated_at
BEFORE UPDATE ON public.user_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Funções de lookup para login/cadastro sem expor tabela inteira
CREATE OR REPLACE FUNCTION public.lookup_account_by_phone(phone_input text)
RETURNS TABLE (
  id uuid,
  full_name text,
  phone_e164 text,
  email text,
  auth_provider text,
  password_hash text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT ua.id, ua.full_name, ua.phone_e164, ua.email, ua.auth_provider, ua.password_hash
  FROM public.user_accounts ua
  WHERE ua.phone_e164 = public.to_br_e164(phone_input)
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.lookup_account_by_email(email_input text)
RETURNS TABLE (
  id uuid,
  full_name text,
  phone_e164 text,
  email text,
  auth_provider text,
  password_hash text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT ua.id, ua.full_name, ua.phone_e164, ua.email, ua.auth_provider, ua.password_hash
  FROM public.user_accounts ua
  WHERE lower(ua.email) = lower(trim(email_input))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_account_by_phone(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_account_by_email(text) TO anon, authenticated;

-- 4) Atualiza trigger de novos usuários para manter profile/roles/accounts consistentes
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
     AND v_email ~ '^[0-9]{10,13}@(phone\\.petcao\\.app|petcao\\.local)$' THEN
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

  INSERT INTO public.user_accounts (id, full_name, phone_e164, email, password_hash, auth_provider)
  VALUES (NEW.id, v_name, v_phone_e164, v_email, NULL, v_provider)
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
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'auth'
      AND c.relname = 'users'
      AND t.tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;

-- 5) Backfill de dados já existentes para evitar contradição Login x Cadastro
UPDATE public.profiles
SET phone = public.to_br_e164(phone)
WHERE phone IS NOT NULL
  AND trim(phone) <> '';

INSERT INTO public.profiles (user_id, name, phone)
SELECT
  u.id,
  COALESCE(NULLIF(trim(u.raw_user_meta_data->>'name'), ''), split_part(COALESCE(u.email, ''), '@', 1), 'Usuário'),
  public.to_br_e164(
    COALESCE(
      u.raw_user_meta_data->>'phone_e164',
      u.raw_user_meta_data->>'phone',
      CASE
        WHEN lower(COALESCE(u.email, '')) ~ '^[0-9]{10,13}@(phone\\.petcao\\.app|petcao\\.local)$'
          THEN split_part(lower(u.email), '@', 1)
        ELSE NULL
      END
    )
  )
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'cliente'::public.app_role
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id
);

INSERT INTO public.user_accounts (id, full_name, phone_e164, email, password_hash, auth_provider, created_at, updated_at)
SELECT
  u.id,
  COALESCE(NULLIF(trim(u.raw_user_meta_data->>'name'), ''), split_part(COALESCE(u.email, ''), '@', 1), 'Usuário'),
  public.to_br_e164(
    COALESCE(
      u.raw_user_meta_data->>'phone_e164',
      u.raw_user_meta_data->>'phone',
      CASE
        WHEN lower(COALESCE(u.email, '')) ~ '^[0-9]{10,13}@(phone\\.petcao\\.app|petcao\\.local)$'
          THEN split_part(lower(u.email), '@', 1)
        ELSE NULL
      END
    )
  ),
  lower(u.email),
  NULL,
  CASE
    WHEN COALESCE(u.raw_app_meta_data->'providers', '[]'::jsonb) ? 'google'
      AND NOT (COALESCE(u.raw_app_meta_data->'providers', '[]'::jsonb) ? 'email')
      THEN 'google'
    ELSE 'local'
  END,
  COALESCE(u.created_at, now()),
  now()
FROM auth.users u
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