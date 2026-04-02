
-- Fix 1: Restrict user_accounts UPDATE to safe columns only
REVOKE UPDATE ON public.user_accounts FROM anon, authenticated;
GRANT UPDATE (full_name, phone_e164) ON public.user_accounts TO authenticated;

-- Fix 2: Restrict profiles UPDATE to safe columns only
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (name, phone, avatar_url, profile_completed, lgpd_accepted, lgpd_accepted_at, notifications_enabled, updated_at) ON public.profiles TO authenticated;

-- Fix 3: Restrict feature_flags read to authenticated only
DROP POLICY IF EXISTS "Authenticated can read feature_flags" ON public.feature_flags;
CREATE POLICY "Authenticated can read feature_flags"
ON public.feature_flags FOR SELECT TO authenticated
USING (true);
