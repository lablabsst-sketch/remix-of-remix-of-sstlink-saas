-- Add missing columns
ALTER TABLE public.trabajadores ADD COLUMN IF NOT EXISTS telefono text;
ALTER TABLE public.trabajadores ADD COLUMN IF NOT EXISTS tipo_contrato text;

-- Add unique constraint
ALTER TABLE public.trabajadores ADD CONSTRAINT unique_trabajador_documento UNIQUE (empresa_id, numero_documento);

-- Validation trigger instead of CHECK constraints
CREATE OR REPLACE FUNCTION public.validate_trabajador()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.tipo_documento NOT IN ('CC','CE','PP','TI','NIT') THEN
    RAISE EXCEPTION 'tipo_documento inválido: %', NEW.tipo_documento;
  END IF;
  IF NEW.estado NOT IN ('aprobado','pendiente','inactivo') THEN
    RAISE EXCEPTION 'estado inválido: %', NEW.estado;
  END IF;
  IF NEW.tipo_contrato IS NOT NULL AND NEW.tipo_contrato NOT IN ('indefinido','fijo','obra','aprendiz','prestacion') THEN
    RAISE EXCEPTION 'tipo_contrato inválido: %', NEW.tipo_contrato;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_trabajador_trigger ON public.trabajadores;
CREATE TRIGGER validate_trabajador_trigger
  BEFORE INSERT OR UPDATE ON public.trabajadores
  FOR EACH ROW EXECUTE FUNCTION public.validate_trabajador();

-- Simplify INSERT policy: any authenticated user in same empresa can insert
DROP POLICY IF EXISTS "Admins can insert workers" ON public.trabajadores;
CREATE POLICY "Users can insert own company workers"
ON public.trabajadores FOR INSERT TO authenticated
WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));