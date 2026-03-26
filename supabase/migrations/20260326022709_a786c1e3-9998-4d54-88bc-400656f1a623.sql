-- Align usuarios schema with auth-linked profiles used by the app
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS auth_user_id uuid;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS nombre_completo text;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS rol text;

UPDATE public.usuarios
SET auth_user_id = user_id
WHERE auth_user_id IS NULL;

UPDATE public.usuarios
SET nombre_completo = trim(concat_ws(' ', nombre, apellido))
WHERE nombre_completo IS NULL;

UPDATE public.usuarios
SET email = ''
WHERE email IS NULL;

UPDATE public.usuarios u
SET rol = CASE
  WHEN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = COALESCE(u.auth_user_id, u.user_id)
      AND ur.role IN ('super_admin', 'administrador')
  ) THEN 'administrador'
  WHEN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = COALESCE(u.auth_user_id, u.user_id)
      AND ur.role = 'asistente'
  ) THEN 'asistente'
  ELSE 'lector'
END
WHERE rol IS NULL;

ALTER TABLE public.usuarios ALTER COLUMN auth_user_id SET NOT NULL;
ALTER TABLE public.usuarios ALTER COLUMN nombre_completo SET NOT NULL;
ALTER TABLE public.usuarios ALTER COLUMN email SET NOT NULL;
ALTER TABLE public.usuarios ALTER COLUMN rol SET DEFAULT 'administrador';
ALTER TABLE public.usuarios ALTER COLUMN rol SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.usuarios'::regclass
      AND conname = 'usuarios_auth_user_id_key'
  ) THEN
    ALTER TABLE public.usuarios
      ADD CONSTRAINT usuarios_auth_user_id_key UNIQUE (auth_user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.usuarios'::regclass
      AND conname = 'usuarios_rol_check'
  ) THEN
    ALTER TABLE public.usuarios
      ADD CONSTRAINT usuarios_rol_check CHECK (rol IN ('administrador', 'asistente', 'lector'));
  END IF;
END $$;

-- Make worker start date truly optional for the modal payload
ALTER TABLE public.trabajadores ALTER COLUMN fecha_ingreso DROP NOT NULL;
ALTER TABLE public.trabajadores ALTER COLUMN fecha_ingreso DROP DEFAULT;

-- Keep company resolution compatible with both legacy and aligned profile schemas
CREATE OR REPLACE FUNCTION public.get_user_empresa_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id
  FROM public.usuarios
  WHERE COALESCE(auth_user_id, user_id) = _user_id
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.can_create_empresa(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.usuarios
    WHERE COALESCE(auth_user_id, user_id) = _user_id
      AND empresa_id IS NOT NULL
  )
$$;

CREATE OR REPLACE FUNCTION public.can_assign_initial_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id IS NOT NULL
    AND _role = 'administrador'::public.app_role
    AND NOT EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
    )
$$;

-- Recreate usuarios policies against auth_user_id
DROP POLICY IF EXISTS "Users can insert own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Users can update own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Users can view own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Users in same empresa can view each other" ON public.usuarios;

CREATE POLICY "Users can insert own profile"
ON public.usuarios
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can view own profile"
ON public.usuarios
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

CREATE POLICY "Users in same empresa can view each other"
ON public.usuarios
FOR SELECT
TO authenticated
USING (empresa_id = public.get_user_empresa_id(auth.uid()));

-- Allow authenticated users without a profile/company to complete onboarding
DROP POLICY IF EXISTS "Users can create empresas during onboarding" ON public.empresas;
CREATE POLICY "Users can create empresas during onboarding"
ON public.empresas
FOR INSERT
TO authenticated
WITH CHECK (public.can_create_empresa(auth.uid()));

-- Allow a user's first role bootstrap during registration/profile repair
DROP POLICY IF EXISTS "Users can insert own initial role" ON public.user_roles;
CREATE POLICY "Users can insert own initial role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND public.can_assign_initial_role(auth.uid(), role)
);