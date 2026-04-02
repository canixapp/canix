
-- Fix 1: Restrict profiles SELECT to own record + admin/dev
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;

CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Restrict user_accounts UPDATE to safe columns only (exclude password_hash)
DROP POLICY IF EXISTS "Users can update own user_accounts" ON public.user_accounts;

CREATE POLICY "Users can update own user_accounts safe fields"
ON public.user_accounts FOR UPDATE TO public
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Revoke direct UPDATE on password_hash from anon and authenticated roles
REVOKE UPDATE (password_hash) ON public.user_accounts FROM anon, authenticated;

-- Fix 3: Restrict user_roles SELECT to own roles + admin/dev
DROP POLICY IF EXISTS "Authenticated users can read roles" ON public.user_roles;

CREATE POLICY "Users can read own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
