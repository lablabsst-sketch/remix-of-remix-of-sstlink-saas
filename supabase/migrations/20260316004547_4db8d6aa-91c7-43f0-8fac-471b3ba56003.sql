-- Roles enum
CREATE TYPE public.app_role AS ENUM ('administrador', 'asistente', 'lector');

-- Empresas table
CREATE TABLE public.empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  nit TEXT UNIQUE,
  direccion TEXT,
  telefono TEXT,
  nivel_proteccion TEXT DEFAULT 'basico',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- Usuarios (profiles) table
CREATE TABLE public.usuarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  apellido TEXT,
  cargo TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- User roles table (separate as required)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Helper function for role checking
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

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create usuario profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (user_id, nombre)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'lector');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for empresas
CREATE POLICY "Authenticated users can view empresas"
  ON public.empresas FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage empresas"
  ON public.empresas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'))
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));

-- RLS Policies for usuarios
CREATE POLICY "Users can view own profile"
  ON public.usuarios FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users in same empresa can view each other"
  ON public.usuarios FOR SELECT TO authenticated
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.usuarios WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own profile"
  ON public.usuarios FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert profiles"
  ON public.usuarios FOR INSERT
  WITH CHECK (true);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'))
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "System can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (true);