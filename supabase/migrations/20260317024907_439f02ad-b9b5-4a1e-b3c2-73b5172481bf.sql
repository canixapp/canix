
-- Fix 1: Gallery photo INSERT must enforce submitted_by_user_id = auth.uid()
DROP POLICY IF EXISTS "Authenticated can insert photos pending moderation" ON public.gallery_photos;
CREATE POLICY "Authenticated can insert photos pending moderation"
ON public.gallery_photos FOR INSERT TO public
WITH CHECK (
  auth.uid() IS NOT NULL
  AND moderation_status = 'pendente'
  AND source = 'CLIENTE'
  AND (submitted_by_user_id = auth.uid() OR submitted_by_user_id IS NULL)
);

-- Fix 2: Restrict has_role EXECUTE to authenticated only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
