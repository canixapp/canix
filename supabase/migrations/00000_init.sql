-- ==========================================
-- ESTRUTURA COMPLETA SUPABASE (MIGRAÇÃO INICIAL)
-- CONSOLIDAÇÃO DAS ETAPAS 1 AO 5
-- ==========================================

-- Extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. ENUMS
-- ==========================================
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('dev', 'admin', 'midia', 'cliente');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- 2. TABELAS
-- ==========================================

-- PETSHOPS (Tenant)
CREATE TABLE IF NOT EXISTS public.petshops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    hours TEXT,
    logo_url TEXT,
    theme TEXT,
    settings JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- USER ACCOUNTS
CREATE TABLE IF NOT EXISTS public.user_accounts (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone_e164 TEXT,
    auth_provider TEXT DEFAULT 'local' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    petshop_id UUID REFERENCES public.petshops(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    profile_completed BOOLEAN DEFAULT FALSE NOT NULL,
    must_change_password BOOLEAN DEFAULT FALSE NOT NULL,
    temp_password_expires_at TIMESTAMPTZ,
    lgpd_accepted BOOLEAN DEFAULT FALSE NOT NULL,
    lgpd_accepted_at TIMESTAMPTZ,
    notifications_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- USER ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'cliente'::app_role,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, role)
);

-- PETS
CREATE TABLE IF NOT EXISTS public.pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    petshop_id UUID REFERENCES public.petshops(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    size TEXT NOT NULL, 
    breed TEXT,
    age TEXT,
    weight TEXT,
    coat_type TEXT,
    behavior TEXT,
    allergies TEXT,
    observations TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- PET_NOTES
CREATE TABLE IF NOT EXISTS public.pet_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- SERVICES
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    petshop_id UUID NOT NULL REFERENCES public.petshops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    price_pequeno NUMERIC,
    price_medio NUMERIC,
    price_grande NUMERIC,
    duration_minutes INTEGER,
    icon TEXT,
    active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- PACKAGES
CREATE TABLE IF NOT EXISTS public.packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    petshop_id UUID NOT NULL REFERENCES public.petshops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    interval_days INTEGER NOT NULL DEFAULT 30,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- CUSTOMER_PACKAGES
CREATE TABLE IF NOT EXISTS public.customer_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    petshop_id UUID NOT NULL REFERENCES public.petshops(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
    pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'ativo',
    observation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    petshop_id UUID NOT NULL REFERENCES public.petshops(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    service_name TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente',
    price NUMERIC,
    payment_status TEXT DEFAULT 'pendente',
    payment_method TEXT,
    payment_amount NUMERIC,
    origin TEXT DEFAULT 'cliente',
    notes TEXT,
    cancel_reason TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- APPOINTMENT_PETS
CREATE TABLE IF NOT EXISTS public.appointment_pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    pet_name TEXT NOT NULL,
    pet_size TEXT,
    pet_breed TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- EXPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    petshop_id UUID NOT NULL REFERENCES public.petshops(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- INVENTORY
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    petshop_id UUID NOT NULL REFERENCES public.petshops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER NOT NULL DEFAULT 0,
    purchase_price NUMERIC NOT NULL DEFAULT 0,
    sale_price NUMERIC NOT NULL DEFAULT 0,
    supplier TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- GALLERY_CATEGORIES
CREATE TABLE IF NOT EXISTS public.gallery_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    petshop_id UUID NOT NULL REFERENCES public.petshops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    max_photos INTEGER NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GALLERY_PHOTOS
CREATE TABLE IF NOT EXISTS public.gallery_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    petshop_id UUID NOT NULL REFERENCES public.petshops(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    category TEXT,
    caption TEXT,
    alt TEXT,
    moderation_status TEXT NOT NULL DEFAULT 'pending',
    source TEXT DEFAULT 'upload',
    owner_name TEXT,
    pet_name TEXT,
    submitted_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    submitted_by_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- GALLERY_COMMENTS
CREATE TABLE IF NOT EXISTS public.gallery_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    photo_id UUID NOT NULL REFERENCES public.gallery_photos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_avatar_url TEXT,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- GALLERY_LIKES
CREATE TABLE IF NOT EXISTS public.gallery_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    photo_id UUID NOT NULL REFERENCES public.gallery_photos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(photo_id, user_id)
);

-- REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    petshop_id UUID NOT NULL REFERENCES public.petshops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    pet_name TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    moderation_status TEXT NOT NULL DEFAULT 'published',
    shop_response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- REVIEW_PHOTOS
CREATE TABLE IF NOT EXISTS public.review_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'info',
    status TEXT NOT NULL DEFAULT 'unread',
    link TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- AUDIT_LOG
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity TEXT,
    target_id UUID,
    field TEXT,
    old_value TEXT,
    new_value TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- DASHBOARD_PREFERENCES
CREATE TABLE IF NOT EXISTS public.dashboard_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    modules JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- PAGE_ACCESS_MATRIX
CREATE TABLE IF NOT EXISTS public.page_access_matrix (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role app_role NOT NULL,
    page_key TEXT NOT NULL,
    allowed BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(role, page_key)
);

-- FEATURE_FLAGS
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    petshop_id UUID REFERENCES public.petshops(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(petshop_id, key)
);

-- USER_SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    is_pro BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==========================================
-- 3. FUNÇÕES E TRIGGERS (AUTH & TIMESTAMPS)
-- ==========================================

-- Função has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função handle_new_user (Auto Profile & Role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    phone_val TEXT;
    email_val TEXT;
    name_val TEXT;
BEGIN
    name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Usuário');
    phone_val := COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', NULL);
    email_val := COALESCE(NEW.email, NULL);

    INSERT INTO public.user_accounts (id, full_name, email, phone_e164, auth_provider)
    VALUES (NEW.id, name_val, email_val, phone_val, COALESCE(NEW.raw_user_meta_data->>'provider', 'local'));

    INSERT INTO public.profiles (user_id, name, phone, avatar_url, active, profile_completed)
    VALUES (NEW.id, name_val, phone_val, NEW.raw_user_meta_data->>'avatar_url', TRUE, FALSE);

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'cliente');

    INSERT INTO public.dashboard_preferences (user_id, modules)
    VALUES (NEW.id, '{}'::jsonb);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Atualizador de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_petshops_modtime BEFORE UPDATE ON petshops FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_pets_modtime BEFORE UPDATE ON pets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_appointments_modtime BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_services_modtime BEFORE UPDATE ON services FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_packages_modtime BEFORE UPDATE ON packages FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_customer_packages_modtime BEFORE UPDATE ON customer_packages FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_expenses_modtime BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_inventory_modtime BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Índices de Performance
CREATE INDEX IF NOT EXISTS idx_appointments_customer ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_petshop ON appointments(petshop_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_pets_owner ON pets(owner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_petshop ON gallery_photos(petshop_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, status);

-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.petshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem sua própria conta" ON public.user_accounts FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Perfis são públicos para leitura" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Usuários editam próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Leitura de roles pública" ON public.user_roles FOR SELECT USING (true);

CREATE POLICY "Leitura pública de petshops" ON public.petshops FOR SELECT USING (true);
CREATE POLICY "Admins e Devs editam petshop" ON public.petshops FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dev'));

CREATE POLICY "Dono e funcionários veem pets" ON public.pets FOR SELECT USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dev') OR has_role(auth.uid(), 'midia'));
CREATE POLICY "Dono pode criar pet" ON public.pets FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Dono pode editar próprio pet" ON public.pets FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Funcionários gerenciam pets" ON public.pets FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dev'));

CREATE POLICY "Dono e funcionários veem agendamentos" ON public.appointments FOR SELECT USING (auth.uid() = customer_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dev'));
CREATE POLICY "Cliente pode criar agendamento" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Cliente pode editar/cancelar próprio agendamento" ON public.appointments FOR UPDATE USING (auth.uid() = customer_id);
CREATE POLICY "Funcionários gerenciam agendamentos" ON public.appointments FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dev'));

CREATE POLICY "Permissões herdadas de Appointments" ON public.appointment_pets FOR ALL USING (EXISTS (SELECT 1 FROM public.appointments a WHERE a.id = appointment_id AND (a.customer_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dev'))));

CREATE POLICY "Catálogo público" ON public.services FOR SELECT USING (true);
CREATE POLICY "Funcionários editam catálogo" ON public.services FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dev'));

CREATE POLICY "Pacotes públicos" ON public.packages FOR SELECT USING (true);
CREATE POLICY "Funcionários editam pacotes" ON public.packages FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dev'));

CREATE POLICY "Apenas admin e dev acessam financeiro" ON public.expenses FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dev'));
CREATE POLICY "Apenas admin e dev acessam estoque" ON public.inventory FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dev'));

CREATE POLICY "Galeria pública" ON public.gallery_photos FOR SELECT USING (true);
CREATE POLICY "Usuários logados enviam fotos" ON public.gallery_photos FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = submitted_by_user_id);
CREATE POLICY "Mídia e Admins gerenciam fotos" ON public.gallery_photos FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dev') OR has_role(auth.uid(), 'midia'));

CREATE POLICY "Reviews públicos" ON public.reviews FOR SELECT USING (moderation_status = 'published');
CREATE POLICY "Dono ve sua review" ON public.reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins e Mídia veem tudo" ON public.reviews FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dev') OR has_role(auth.uid(), 'midia'));
CREATE POLICY "Cliente cria review" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins gerenciam" ON public.reviews FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dev') OR has_role(auth.uid(), 'midia'));

CREATE POLICY "Usuário vê e edita suas preferências" ON public.dashboard_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Usuário vê e edita suas notificações" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- 5. STORAGE BUCKETS
-- ==========================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('pets', 'pets', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('gallery', 'gallery', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('reviews', 'reviews', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('petshops', 'petshops', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;



CREATE POLICY "Leitura pública de avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Usuários podem fazer upload do próprio avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Usuários podem modificar seu próprio avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Usuários podem apagar seu próprio avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários autenticados podem ver fotos de pets" ON storage.objects FOR SELECT USING (bucket_id = 'pets' AND auth.role() = 'authenticated');
CREATE POLICY "Upload permitido para fotos de pets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pets' AND auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados gerenciam fotos de pets" ON storage.objects FOR UPDATE USING (bucket_id = 'pets' AND auth.role() = 'authenticated');
CREATE POLICY "Deleção de fotos de pets" ON storage.objects FOR DELETE USING (bucket_id = 'pets' AND auth.role() = 'authenticated');

CREATE POLICY "Leitura pública de galeria" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Usuários autenticados enviando pra galeria" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery' AND auth.role() = 'authenticated');
CREATE POLICY "DevAdminMidia gerencia galeria" ON storage.objects FOR DELETE USING (bucket_id = 'gallery' AND (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('dev', 'admin', 'midia'))));

CREATE POLICY "Leitura pública de reviews" ON storage.objects FOR SELECT USING (bucket_id = 'reviews');
CREATE POLICY "Upload anexos em reviews" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'reviews' AND auth.role() = 'authenticated');

CREATE POLICY "Leitura pública de logos petshop" ON storage.objects FOR SELECT USING (bucket_id = 'petshops');
CREATE POLICY "Upload de logos para admins" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'petshops' AND (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('dev', 'admin'))));
