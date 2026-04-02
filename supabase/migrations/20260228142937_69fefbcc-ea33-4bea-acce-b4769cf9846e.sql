
-- Audit log for destructive actions
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  target_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Devs can manage audit_log" ON public.audit_log
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'dev'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'dev'::app_role));

-- Add profile_completed to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_completed boolean NOT NULL DEFAULT false;
