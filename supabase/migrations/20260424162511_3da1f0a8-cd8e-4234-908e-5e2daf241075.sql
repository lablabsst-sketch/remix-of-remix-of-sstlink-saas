-- 1. Quitar triggers de las 25 tablas
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
  END LOOP;
END $$;

-- 2. Borrar función trigger
DROP FUNCTION IF EXISTS public.notify_sync_push() CASCADE;

-- 3. Borrar tablas de configuración e historial del sync
DROP TABLE IF EXISTS public.sync_config CASCADE;
DROP TABLE IF EXISTS public.sync_log CASCADE;

-- 4. Borrar secret del vault si existe
DO $$
BEGIN
  DELETE FROM vault.secrets WHERE name = 'sync_shared_secret_value';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;