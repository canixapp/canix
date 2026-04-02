
-- ========================================================
-- V2 PASSO 2: CRIAR TODAS AS TABELAS
-- ========================================================

-- 1. PETSHOPS
CREATE TABLE public.petshops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  phone text,
  address text,
  latitude double precision,
  longitude double precision,
  theme text DEFAULT 'light',
  logo_url text,
  hours text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.petshops ENABLE ROW LEVEL SECURITY;

-- 2. ADD petshop_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS petshop_id uuid REFERENCES public.petshops(id);

-- 3. PETS
CREATE TABLE public.pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  petshop_id uuid REFERENCES public.petshops(id),
  name text NOT NULL,
  size text NOT NULL CHECK (size IN ('pequeno','medio','grande')),
  breed text DEFAULT '',
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- 4. SERVICES
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  petshop_id uuid NOT NULL REFERENCES public.petshops(id),
  name text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL CHECK (category IN ('banho','tosa','combo','outro')),
  icon text DEFAULT 'scissors',
  duration_minutes integer DEFAULT 60,
  price_pequeno numeric(10,2) DEFAULT 0,
  price_medio numeric(10,2) DEFAULT 0,
  price_grande numeric(10,2) DEFAULT 0,
  active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 5. PACKAGES
CREATE TABLE public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  petshop_id uuid NOT NULL REFERENCES public.petshops(id),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('SEMANAL','QUINZENAL')),
  description text DEFAULT '',
  interval_days integer NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- 6. CUSTOMER_PACKAGES
CREATE TABLE public.customer_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  petshop_id uuid NOT NULL REFERENCES public.petshops(id),
  customer_id uuid NOT NULL,
  pet_id uuid REFERENCES public.pets(id),
  package_id uuid REFERENCES public.packages(id),
  status text NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO','DESATIVADO','EXPIRADO')),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  observation text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_packages ENABLE ROW LEVEL SECURITY;

-- 7. APPOINTMENTS
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  petshop_id uuid NOT NULL REFERENCES public.petshops(id),
  customer_id uuid NOT NULL,
  service_id uuid REFERENCES public.services(id),
  service_name text NOT NULL,
  date date NOT NULL,
  time time NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','confirmado','realizado','cancelado','remarcado')),
  price numeric(10,2) DEFAULT 0,
  payment_status text DEFAULT 'nao_cobrado' CHECK (payment_status IN ('pago','pendente','nao_cobrado')),
  payment_method text CHECK (payment_method IN ('pix','dinheiro','cartao')),
  payment_amount numeric(10,2),
  cancel_reason text,
  completed_at timestamptz,
  origin text DEFAULT 'sistema' CHECK (origin IN ('whatsapp','admin','sistema','pacote')),
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 8. APPOINTMENT_PETS (many-to-many)
CREATE TABLE public.appointment_pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  pet_id uuid NOT NULL REFERENCES public.pets(id),
  pet_name text NOT NULL,
  pet_size text,
  pet_breed text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.appointment_pets ENABLE ROW LEVEL SECURITY;

-- 9. GALLERY_PHOTOS
CREATE TABLE public.gallery_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  petshop_id uuid NOT NULL REFERENCES public.petshops(id),
  url text NOT NULL,
  alt text DEFAULT '',
  caption text DEFAULT '',
  category text CHECK (category IN ('ambiente','antes-depois','pets','outro')),
  moderation_status text NOT NULL DEFAULT 'pendente' CHECK (moderation_status IN ('pendente','aprovado','rejeitado')),
  source text DEFAULT 'PETSHOP' CHECK (source IN ('CLIENTE','PETSHOP')),
  submitted_by_user_id uuid,
  submitted_by_name text,
  pet_name text,
  owner_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

-- 10. REVIEWS
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  petshop_id uuid NOT NULL REFERENCES public.petshops(id),
  user_id uuid,
  name text NOT NULL,
  pet_name text DEFAULT '',
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text DEFAULT '',
  comment text DEFAULT '',
  moderation_status text NOT NULL DEFAULT 'pendente' CHECK (moderation_status IN ('pendente','aprovado','rejeitado')),
  shop_response text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 11. REVIEW_PHOTOS
CREATE TABLE public.review_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.review_photos ENABLE ROW LEVEL SECURITY;

-- 12. FEATURE_FLAGS
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  petshop_id uuid REFERENCES public.petshops(id),
  key text NOT NULL,
  enabled boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(petshop_id, key)
);
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- UPDATE TRIGGERS
-- ========================================================
CREATE TRIGGER set_updated_at_petshops BEFORE UPDATE ON public.petshops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_pets BEFORE UPDATE ON public.pets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_services BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_packages BEFORE UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_customer_packages BEFORE UPDATE ON public.customer_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_appointments BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_feature_flags BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================================
-- RLS POLICIES
-- ========================================================

-- PETSHOPS: anyone can read, dev can manage
CREATE POLICY "Anyone can read petshops" ON public.petshops FOR SELECT USING (true);
CREATE POLICY "Devs can manage petshops" ON public.petshops FOR ALL USING (has_role(auth.uid(), 'dev')) WITH CHECK (has_role(auth.uid(), 'dev'));

-- PETS: owners can CRUD own, dev/admin can read all
CREATE POLICY "Owners can manage own pets" ON public.pets FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Devs can manage all pets" ON public.pets FOR ALL USING (has_role(auth.uid(), 'dev')) WITH CHECK (has_role(auth.uid(), 'dev'));
CREATE POLICY "Admins can read all pets" ON public.pets FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- SERVICES: anyone can read, dev/admin can manage
CREATE POLICY "Anyone can read services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Devs can manage services" ON public.services FOR ALL USING (has_role(auth.uid(), 'dev')) WITH CHECK (has_role(auth.uid(), 'dev'));
CREATE POLICY "Admins can manage services" ON public.services FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- PACKAGES: anyone can read, dev/admin can manage
CREATE POLICY "Anyone can read packages" ON public.packages FOR SELECT USING (true);
CREATE POLICY "Devs can manage packages" ON public.packages FOR ALL USING (has_role(auth.uid(), 'dev')) WITH CHECK (has_role(auth.uid(), 'dev'));
CREATE POLICY "Admins can manage packages" ON public.packages FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- CUSTOMER_PACKAGES: owner can read own, dev/admin can manage all
CREATE POLICY "Owners can read own customer_packages" ON public.customer_packages FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Devs can manage customer_packages" ON public.customer_packages FOR ALL USING (has_role(auth.uid(), 'dev')) WITH CHECK (has_role(auth.uid(), 'dev'));
CREATE POLICY "Admins can manage customer_packages" ON public.customer_packages FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- APPOINTMENTS: owner can read own, dev/admin can manage all
CREATE POLICY "Owners can read own appointments" ON public.appointments FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Owners can insert own appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Devs can manage appointments" ON public.appointments FOR ALL USING (has_role(auth.uid(), 'dev')) WITH CHECK (has_role(auth.uid(), 'dev'));
CREATE POLICY "Admins can manage appointments" ON public.appointments FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- APPOINTMENT_PETS: follow appointment access
CREATE POLICY "Users can read own appointment_pets" ON public.appointment_pets FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.appointments a WHERE a.id = appointment_id AND a.customer_id = auth.uid())
);
CREATE POLICY "Users can insert own appointment_pets" ON public.appointment_pets FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.appointments a WHERE a.id = appointment_id AND a.customer_id = auth.uid())
);
CREATE POLICY "Devs can manage appointment_pets" ON public.appointment_pets FOR ALL USING (has_role(auth.uid(), 'dev')) WITH CHECK (has_role(auth.uid(), 'dev'));
CREATE POLICY "Admins can manage appointment_pets" ON public.appointment_pets FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- GALLERY_PHOTOS: public can read approved, dev/admin/midia can manage
CREATE POLICY "Anyone can read approved photos" ON public.gallery_photos FOR SELECT USING (moderation_status = 'aprovado');
CREATE POLICY "Authenticated can insert photos" ON public.gallery_photos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Devs can manage gallery" ON public.gallery_photos FOR ALL USING (has_role(auth.uid(), 'dev')) WITH CHECK (has_role(auth.uid(), 'dev'));
CREATE POLICY "Admins can manage gallery" ON public.gallery_photos FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Midia can manage gallery" ON public.gallery_photos FOR ALL USING (has_role(auth.uid(), 'midia')) WITH CHECK (has_role(auth.uid(), 'midia'));

-- REVIEWS: public can read approved, owner can manage own, dev/admin/midia can manage
CREATE POLICY "Anyone can read approved reviews" ON public.reviews FOR SELECT USING (moderation_status = 'aprovado');
CREATE POLICY "Users can insert own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own reviews" ON public.reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Devs can manage reviews" ON public.reviews FOR ALL USING (has_role(auth.uid(), 'dev')) WITH CHECK (has_role(auth.uid(), 'dev'));
CREATE POLICY "Admins can manage reviews" ON public.reviews FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Midia can manage reviews" ON public.reviews FOR ALL USING (has_role(auth.uid(), 'midia')) WITH CHECK (has_role(auth.uid(), 'midia'));

-- REVIEW_PHOTOS: follow review access
CREATE POLICY "Anyone can read approved review photos" ON public.review_photos FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.reviews r WHERE r.id = review_id AND r.moderation_status = 'aprovado')
);
CREATE POLICY "Users can insert own review photos" ON public.review_photos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.reviews r WHERE r.id = review_id AND r.user_id = auth.uid())
);
CREATE POLICY "Devs can manage review_photos" ON public.review_photos FOR ALL USING (has_role(auth.uid(), 'dev')) WITH CHECK (has_role(auth.uid(), 'dev'));
CREATE POLICY "Admins can manage review_photos" ON public.review_photos FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Midia can manage review_photos" ON public.review_photos FOR ALL USING (has_role(auth.uid(), 'midia')) WITH CHECK (has_role(auth.uid(), 'midia'));

-- FEATURE_FLAGS: authenticated can read, dev can manage
CREATE POLICY "Authenticated can read feature_flags" ON public.feature_flags FOR SELECT USING (true);
CREATE POLICY "Devs can manage feature_flags" ON public.feature_flags FOR ALL USING (has_role(auth.uid(), 'dev')) WITH CHECK (has_role(auth.uid(), 'dev'));

-- ========================================================
-- STORAGE BUCKETS
-- ========================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars-users', 'avatars-users', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars-pets', 'avatars-pets', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('review-photos', 'review-photos', true);

-- Storage RLS policies
CREATE POLICY "Anyone can read logos" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "Devs can upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos' AND public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Anyone can read user avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars-users');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars-users' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars-users' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can read pet avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars-pets');
CREATE POLICY "Users can upload pet avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars-pets' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update pet avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars-pets' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can read gallery" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Authenticated can upload gallery" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery' AND auth.uid() IS NOT NULL);
CREATE POLICY "Devs can delete gallery" ON storage.objects FOR DELETE USING (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'dev'));
CREATE POLICY "Admins can delete gallery" ON storage.objects FOR DELETE USING (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read review photos" ON storage.objects FOR SELECT USING (bucket_id = 'review-photos');
CREATE POLICY "Authenticated can upload review photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'review-photos' AND auth.uid() IS NOT NULL);
