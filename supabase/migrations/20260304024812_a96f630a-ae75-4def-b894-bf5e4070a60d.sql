-- Add LGPD consent fields to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS lgpd_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lgpd_accepted_at timestamptz;

-- Add admin manage policy for audit_log
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage audit_log' AND tablename = 'audit_log'
  ) THEN
    CREATE POLICY "Admins can manage audit_log" ON public.audit_log FOR ALL TO authenticated
      USING (has_role(auth.uid(), 'admin'::app_role))
      WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;