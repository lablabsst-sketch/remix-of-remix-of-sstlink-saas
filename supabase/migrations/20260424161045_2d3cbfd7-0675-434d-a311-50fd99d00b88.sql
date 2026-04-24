-- 1. Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- 2. Guardar el secret en el vault (se lee desde una función SECURITY DEFINER)
-- Si ya existe, lo actualizamos; si no, lo creamos
DO $$
DECLARE
  _secret_id uuid;
BEGIN
  SELECT id INTO _secret_id FROM vault.secrets WHERE name = 'sync_shared_secret_value';
  IF _secret_id IS NULL THEN
    -- Placeholder; el valor real se debe inyectar manualmente o via función helper.
    -- Lo dejamos vacío y la función lo lee desde una tabla de configuración fallback.
    PERFORM vault.create_secret('CONFIGURE_ME', 'sync_shared_secret_value', 'Secret compartido para sync hacia Supabase externo');
  END IF;
END $$;

-- 3. Tabla de configuración interna para el endpoint y secret (más simple que vault)
CREATE TABLE IF NOT EXISTS public.sync_config (
  id int PRIMARY KEY DEFAULT 1,
  endpoint_url text NOT NULL,
  shared_secret text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  CONSTRAINT single_row CHECK (id = 1)
);

-- Restringir acceso
ALTER TABLE public.sync_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Solo super_admin lee sync_config"
  ON public.sync_config FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Insert inicial (debes actualizar shared_secret con el valor real luego)
INSERT INTO public.sync_config (id, endpoint_url, shared_secret, enabled)
VALUES (
  1,
  'https://waurqxbvxezdvmdcmgjt.supabase.co/functions/v1/sync-push',
  'REEMPLAZAR_CON_SYNC_SHARED_SECRET',
  true
)
ON CONFLICT (id) DO NOTHING;

-- 4. Función trigger que envía el cambio al edge function sync-push
CREATE OR REPLACE FUNCTION public.notify_sync_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _config record;
  _payload jsonb;
  _record jsonb;
  _old_record jsonb;
BEGIN
  SELECT endpoint_url, shared_secret, enabled
    INTO _config
    FROM public.sync_config
    WHERE id = 1;

  IF _config IS NULL OR _config.enabled = false THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'DELETE' THEN
    _record := NULL;
    _old_record := to_jsonb(OLD);
  ELSE
    _record := to_jsonb(NEW);
    _old_record := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END;
  END IF;

  -- Loop guard: si el registro viene marcado por sync-receive, no reenviar
  IF _record IS NOT NULL AND _record ? '__sync_origin' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  _payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', _record,
    'old_record', _old_record
  );

  PERFORM extensions.http_post(
    url := _config.endpoint_url,
    body := _payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-sync-secret', _config.shared_secret
    ),
    timeout_milliseconds := 5000
  );

  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- Nunca bloquear la operación local por fallo del sync
  RAISE WARNING 'sync-push falló para %.%: %', TG_TABLE_NAME, TG_OP, SQLERRM;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 5. Helper para crear el trigger en cada tabla
DO $$
DECLARE
  _tables text[] := ARRAY[
    'empresas','usuarios','user_roles','trabajadores',
    'documentos_trabajador','documentos_empresa','documentos_sgsst','carpetas_sgsst',
    'capacitaciones','asistencia_capacitacion','accidentes','ausencias',
    'examenes_medicos','perfil_sociodemografico','contratistas','empleados_contratista',
    'clientes_portal','trabajadores_cliente','docs_empresa_cliente','sedes',
    'activos','plan_mejora','items_plan_mejora','docs_estandar','empresa_estandares'
  ];
  _t text;
BEGIN
  FOREACH _t IN ARRAY _tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_sync_push ON public.%I', _t);
    EXECUTE format(
      'CREATE TRIGGER trg_sync_push
         AFTER INSERT OR UPDATE OR DELETE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.notify_sync_push()',
      _t
    );
  END LOOP;
END $$;