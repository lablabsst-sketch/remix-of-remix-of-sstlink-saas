-- Add verification fields to trabajadores
ALTER TABLE public.trabajadores
  ADD COLUMN IF NOT EXISTS verificado_ingreso boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verificado_en timestamp with time zone,
  ADD COLUMN IF NOT EXISTS verificado_por uuid;

-- Allow asistente role to update workers (currently only admin/super_admin can update)
-- We replace the existing UPDATE policy to include 'asistente'
DROP POLICY IF EXISTS "Admins can update workers" ON public.trabajadores;

CREATE POLICY "Admins and asistentes can update workers"
ON public.trabajadores
FOR UPDATE
TO authenticated
USING (
  empresa_id = public.get_user_empresa_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'administrador'::public.app_role)
    OR public.has_role(auth.uid(), 'asistente'::public.app_role)
  )
);