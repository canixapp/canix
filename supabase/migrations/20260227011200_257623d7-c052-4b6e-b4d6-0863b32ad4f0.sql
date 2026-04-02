
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('dev', 'admin', 'midia', 'cliente');

-- 2. Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone authenticated can read (needed for admin views)
CREATE POLICY "Authenticated users can read profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Create user_roles table (separate from profiles per security best practice)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read roles (needed for permission checks)
CREATE POLICY "Authenticated users can read roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

-- 4. Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. Only devs can insert/update/delete roles
CREATE POLICY "Devs can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'dev'))
  WITH CHECK (public.has_role(auth.uid(), 'dev'));

-- 6. Only devs can insert/update/delete other profiles
CREATE POLICY "Devs can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'dev'))
  WITH CHECK (public.has_role(auth.uid(), 'dev'));

-- 7. Create page_access_matrix table
CREATE TABLE public.page_access_matrix (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role app_role NOT NULL,
  page_key TEXT NOT NULL,
  allowed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (role, page_key)
);

ALTER TABLE public.page_access_matrix ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read permissions
CREATE POLICY "Authenticated can read page access"
  ON public.page_access_matrix FOR SELECT
  TO authenticated
  USING (true);

-- Only devs can manage page access
CREATE POLICY "Devs can manage page access"
  ON public.page_access_matrix FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'dev'))
  WITH CHECK (public.has_role(auth.uid(), 'dev'));

-- 8. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_page_access_updated_at
  BEFORE UPDATE ON public.page_access_matrix
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'phone'
  );
  -- Default role: cliente
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cliente');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Seed default page access matrix
INSERT INTO public.page_access_matrix (role, page_key, allowed) VALUES
  ('admin', 'dashboard', true),
  ('admin', 'agendamentos', true),
  ('admin', 'clientes', true),
  ('admin', 'pacotes', true),
  ('admin', 'valores', true),
  ('admin', 'moderacao', true),
  ('admin', 'configuracoes', true),
  ('admin', 'servicos', false),
  ('midia', 'dashboard', false),
  ('midia', 'agendamentos', false),
  ('midia', 'clientes', false),
  ('midia', 'pacotes', false),
  ('midia', 'valores', false),
  ('midia', 'moderacao', true),
  ('midia', 'configuracoes', false),
  ('midia', 'servicos', false),
  ('cliente', 'perfil', true),
  ('cliente', 'area_cliente', true);
