-- Fix permissive INSERT policies by restricting to service_role only
DROP POLICY "System can insert profiles" ON public.usuarios;
DROP POLICY "System can insert roles" ON public.user_roles;

-- The handle_new_user trigger runs as SECURITY DEFINER so it bypasses RLS.
-- We only need authenticated users to NOT be able to insert arbitrary profiles.
CREATE POLICY "Users can insert own profile"
  ON public.usuarios FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));