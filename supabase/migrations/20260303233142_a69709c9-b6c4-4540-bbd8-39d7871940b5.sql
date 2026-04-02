
CREATE TABLE public.gallery_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  petshop_id uuid NOT NULL REFERENCES public.petshops(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  max_photos integer NOT NULL DEFAULT 10,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.gallery_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can read categories
CREATE POLICY "Anyone can read gallery_categories"
  ON public.gallery_categories FOR SELECT
  USING (true);

-- Devs can manage
CREATE POLICY "Devs can manage gallery_categories"
  ON public.gallery_categories FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'dev'))
  WITH CHECK (public.has_role(auth.uid(), 'dev'));

-- Admins can manage
CREATE POLICY "Admins can manage gallery_categories"
  ON public.gallery_categories FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default categories
INSERT INTO public.gallery_categories (petshop_id, name, slug, max_photos, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Pets', 'pets', 10, 1),
  ('a0000000-0000-0000-0000-000000000001', 'Ambiente', 'ambiente', 10, 2),
  ('a0000000-0000-0000-0000-000000000001', 'Antes e Depois', 'antes-depois', 10, 3);
