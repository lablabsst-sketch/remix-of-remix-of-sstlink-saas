-- Tabla de auditoría para cambios de verificación
CREATE TABLE public.verificacion_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trabajador_id UUID NOT NULL,
  empresa_id UUID NOT NULL,
  valor_anterior BOOLEAN,
  valor_nuevo BOOLEAN NOT NULL,
  cambiado_por UUID,
  cambiado_por_nombre TEXT,
  cambiado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para consultas eficientes
CREATE INDEX idx_verificacion_audit_trabajador ON public.verificacion_audit(trabajador_id, cambiado_en DESC);
CREATE INDEX idx_verificacion_audit_empresa ON public.verificacion_audit(empresa_id, cambiado_en DESC);

-- Habilitar RLS
ALTER TABLE public.verificacion_audit ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver el log de su empresa
CREATE POLICY "Admins ven audit de su empresa"
ON public.verificacion_audit
FOR SELECT
TO authenticated
USING (
  empresa_id = get_user_empresa_id(auth.uid())
  AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'administrador'::app_role))
);

-- Insert permitido para usuarios autenticados de la empresa (lo hace el trigger)
CREATE POLICY "Sistema inserta audit"
ON public.verificacion_audit
FOR INSERT
TO authenticated
WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

-- Función trigger que registra cambios en verificado_ingreso
CREATE OR REPLACE FUNCTION public.log_verificacion_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _nombre TEXT;
BEGIN
  -- Solo registrar si cambió el valor de verificado_ingreso
  IF OLD.verificado_ingreso IS DISTINCT FROM NEW.verificado_ingreso THEN
    -- Obtener nombre del usuario que hizo el cambio
    SELECT nombre_completo INTO _nombre
    FROM public.usuarios
    WHERE auth_user_id = auth.uid()
    LIMIT 1;

    INSERT INTO public.verificacion_audit (
      trabajador_id, empresa_id, valor_anterior, valor_nuevo,
      cambiado_por, cambiado_por_nombre
    ) VALUES (
      NEW.id, NEW.empresa_id, OLD.verificado_ingreso, NEW.verificado_ingreso,
      auth.uid(), _nombre
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger en la tabla trabajadores
CREATE TRIGGER trg_log_verificacion_change
AFTER UPDATE OF verificado_ingreso ON public.trabajadores
FOR EACH ROW
EXECUTE FUNCTION public.log_verificacion_change();