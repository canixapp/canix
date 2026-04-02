
-- Fix 1: Restrict gallery_photos INSERT to enforce pending moderation
DROP POLICY IF EXISTS "Authenticated can insert photos" ON public.gallery_photos;
CREATE POLICY "Authenticated can insert photos pending moderation"
ON public.gallery_photos FOR INSERT TO public
WITH CHECK (
  auth.uid() IS NOT NULL
  AND moderation_status = 'pendente'
  AND source = 'CLIENTE'
);

-- Fix 2: Restrict reviews INSERT to enforce pending moderation
DROP POLICY IF EXISTS "Users can insert own reviews" ON public.reviews;
CREATE POLICY "Users can insert own reviews pending moderation"
ON public.reviews FOR INSERT TO public
WITH CHECK (
  auth.uid() = user_id
  AND moderation_status = 'pendente'
);

-- Fix 3: Remove direct user_accounts UPDATE for regular users entirely
-- They should only update via edge functions / admin
DROP POLICY IF EXISTS "Users can update own user_accounts safe fields" ON public.user_accounts;
-- Re-grant full UPDATE to service_role (edge functions use this)
-- Regular users cannot update user_accounts at all now
