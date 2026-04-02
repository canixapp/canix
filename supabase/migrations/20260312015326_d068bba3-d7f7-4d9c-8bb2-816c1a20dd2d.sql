
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS temp_password_expires_at timestamptz DEFAULT NULL;
