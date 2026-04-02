
-- Add extended pet profile fields
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS age text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS weight text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS behavior text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS allergies text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS coat_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS observations text DEFAULT NULL;

-- Create inventory table for PRO stock control
CREATE TABLE IF NOT EXISTS public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  petshop_id uuid NOT NULL REFERENCES public.petshops(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'geral',
  quantity integer NOT NULL DEFAULT 0,
  min_quantity integer NOT NULL DEFAULT 0,
  purchase_price numeric NOT NULL DEFAULT 0,
  sale_price numeric NOT NULL DEFAULT 0,
  supplier text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage inventory" ON public.inventory FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Devs can manage inventory" ON public.inventory FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'dev'::app_role))
  WITH CHECK (has_role(auth.uid(), 'dev'::app_role));
