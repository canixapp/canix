
-- pet_notes table for pet prontuário
CREATE TABLE public.pet_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pet_notes ENABLE ROW LEVEL SECURITY;

-- RLS: devs full access
CREATE POLICY "Devs can manage pet_notes"
  ON public.pet_notes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'dev'))
  WITH CHECK (public.has_role(auth.uid(), 'dev'));

-- RLS: admins full access
CREATE POLICY "Admins can manage pet_notes"
  ON public.pet_notes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: pet owners can read own pet notes
CREATE POLICY "Owners can read own pet_notes"
  ON public.pet_notes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pets p WHERE p.id = pet_notes.pet_id AND p.owner_id = auth.uid()
  ));
