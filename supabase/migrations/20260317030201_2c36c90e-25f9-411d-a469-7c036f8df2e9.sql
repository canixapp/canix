
-- Fix: Re-grant EXECUTE on has_role to authenticated users.
-- has_role is SECURITY DEFINER so it safely bypasses RLS internally.
-- Authenticated users MUST be able to call it for RLS policies to work.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
