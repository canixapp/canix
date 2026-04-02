
CREATE POLICY "Admins can read user_accounts"
ON public.user_accounts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
