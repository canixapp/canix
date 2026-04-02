
-- Revoke SELECT on password_hash from regular users
REVOKE SELECT ON public.user_accounts FROM anon, authenticated;
GRANT SELECT (id, email, full_name, phone_e164, auth_provider, created_at, updated_at) ON public.user_accounts TO authenticated;
GRANT SELECT (id, email, full_name, phone_e164, auth_provider, created_at, updated_at) ON public.user_accounts TO anon;
