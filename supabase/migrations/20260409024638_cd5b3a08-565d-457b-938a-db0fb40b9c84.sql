
-- =============================================
-- NEW COLUMNS ON TRABAJADORES
-- =============================================
ALTER TABLE public.trabajadores
  ADD COLUMN IF NOT EXISTS tipo_trabajador text DEFAULT 'directo',
  ADD COLUMN IF NOT EXISTS genero text,
  ADD COLUMN IF NOT EXISTS fecha_nacimiento date,
  ADD COLUMN IF NOT EXISTS rh text,
  ADD COLUMN IF NOT EXISTS ciudad text,
  ADD COLUMN IF NOT EXISTS departamento text,
  ADD COLUMN IF NOT EXISTS direccion text,
  ADD COLUMN IF NOT EXISTS pais text DEFAULT 'Colombia',
  ADD COLUMN IF NOT EXISTS ciudad_residencia text,
  ADD COLUMN IF NOT EXISTS departamento_residencia text,
  ADD COLUMN IF NOT EXISTS sede text,
  ADD COLUMN IF NOT EXISTS arl text,
  ADD COLUMN IF NOT EXISTS eps text,
  ADD COLUMN IF NOT EXISTS pension text,
  ADD COLUMN IF NOT EXISTS caja_compensacion text,
  ADD COLUMN IF NOT EXISTS empresa_contratista uuid,
  ADD COLUMN IF NOT EXISTS nombre_contacto_emergencia text,
  ADD COLUMN IF NOT EXISTS celular_contacto_emergencia text,
  ADD COLUMN IF NOT EXISTS parentesco_contacto_emergencia text,
  ADD COLUMN IF NOT EXISTS fecha_fin_contrato date,
  ADD COLUMN IF NOT EXISTS eliminado boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS eliminado_en timestamptz;

-- =============================================
-- SEDES
-- =============================================
CREATE TABLE IF NOT EXISTS public.sedes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  direccion text,
  ciudad text,
  departamento text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sedes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_sedes" ON public.sedes FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "insert_own_sedes" ON public.sedes FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "update_own_sedes" ON public.sedes FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "delete_own_sedes" ON public.sedes FOR DELETE USING (empresa_id = get_user_empresa_id(auth.uid()) AND (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'administrador'::app_role)));

-- =============================================
-- PERFIL_SOCIODEMOGRAFICO
-- =============================================
CREATE TABLE IF NOT EXISTS public.perfil_sociodemografico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trabajador_id uuid NOT NULL REFERENCES public.trabajadores(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nivel_educativo text,
  estado_civil text,
  num_hijos integer DEFAULT 0,
  estrato integer,
  tipo_vivienda text,
  medio_transporte text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.perfil_sociodemografico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_perfil" ON public.perfil_sociodemografico FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "insert_own_perfil" ON public.perfil_sociodemografico FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "update_own_perfil" ON public.perfil_sociodemografico FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "delete_own_perfil" ON public.perfil_sociodemografico FOR DELETE USING (empresa_id = get_user_empresa_id(auth.uid()) AND (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'administrador'::app_role)));

-- =============================================
-- CAPACITACIONES
-- =============================================
CREATE TABLE IF NOT EXISTS public.capacitaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descripcion text,
  fecha date NOT NULL,
  duracion_horas numeric DEFAULT 1,
  tipo text,
  responsable text,
  estado text NOT NULL DEFAULT 'programada',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.capacitaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_capacitaciones" ON public.capacitaciones FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "insert_own_capacitaciones" ON public.capacitaciones FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "update_own_capacitaciones" ON public.capacitaciones FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "delete_own_capacitaciones" ON public.capacitaciones FOR DELETE USING (empresa_id = get_user_empresa_id(auth.uid()) AND (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'administrador'::app_role)));

-- =============================================
-- ASISTENCIA_CAPACITACION
-- =============================================
CREATE TABLE IF NOT EXISTS public.asistencia_capacitacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capacitacion_id uuid NOT NULL REFERENCES public.capacitaciones(id) ON DELETE CASCADE,
  trabajador_id uuid NOT NULL REFERENCES public.trabajadores(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  asistio boolean DEFAULT false,
  nota numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.asistencia_capacitacion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_asistencia" ON public.asistencia_capacitacion FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "insert_own_asistencia" ON public.asistencia_capacitacion FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "update_own_asistencia" ON public.asistencia_capacitacion FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "delete_own_asistencia" ON public.asistencia_capacitacion FOR DELETE USING (empresa_id = get_user_empresa_id(auth.uid()) AND (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'administrador'::app_role)));

-- =============================================
-- ACCIDENTES
-- =============================================
CREATE TABLE IF NOT EXISTS public.accidentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  trabajador_id uuid REFERENCES public.trabajadores(id) ON DELETE SET NULL,
  fecha date NOT NULL,
  descripcion text,
  tipo text,
  severidad text,
  dias_incapacidad integer DEFAULT 0,
  lugar text,
  parte_cuerpo text,
  reportado_arl boolean DEFAULT false,
  estado text NOT NULL DEFAULT 'abierto',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.accidentes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_accidentes" ON public.accidentes FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "insert_own_accidentes" ON public.accidentes FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "update_own_accidentes" ON public.accidentes FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "delete_own_accidentes" ON public.accidentes FOR DELETE USING (empresa_id = get_user_empresa_id(auth.uid()) AND (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'administrador'::app_role)));

-- =============================================
-- AUSENCIAS
-- =============================================
CREATE TABLE IF NOT EXISTS public.ausencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  trabajador_id uuid NOT NULL REFERENCES public.trabajadores(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  fecha_inicio date NOT NULL,
  fecha_fin date,
  dias integer DEFAULT 1,
  motivo text,
  soporte_url text,
  estado text NOT NULL DEFAULT 'pendiente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ausencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_ausencias" ON public.ausencias FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "insert_own_ausencias" ON public.ausencias FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "update_own_ausencias" ON public.ausencias FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "delete_own_ausencias" ON public.ausencias FOR DELETE USING (empresa_id = get_user_empresa_id(auth.uid()) AND (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'administrador'::app_role)));

-- =============================================
-- EXAMENES_MEDICOS
-- =============================================
CREATE TABLE IF NOT EXISTS public.examenes_medicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  trabajador_id uuid NOT NULL REFERENCES public.trabajadores(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  fecha date NOT NULL,
  resultado text,
  concepto text,
  restricciones text,
  proximo_control date,
  soporte_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.examenes_medicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_examenes" ON public.examenes_medicos FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "insert_own_examenes" ON public.examenes_medicos FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "update_own_examenes" ON public.examenes_medicos FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "delete_own_examenes" ON public.examenes_medicos FOR DELETE USING (empresa_id = get_user_empresa_id(auth.uid()) AND (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'administrador'::app_role)));

-- =============================================
-- DOCUMENTOS_EMPRESA
-- =============================================
CREATE TABLE IF NOT EXISTS public.documentos_empresa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  tipo text,
  url text,
  fecha_vencimiento date,
  estado text NOT NULL DEFAULT 'vigente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.documentos_empresa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_docs_empresa" ON public.documentos_empresa FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "insert_own_docs_empresa" ON public.documentos_empresa FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "update_own_docs_empresa" ON public.documentos_empresa FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "delete_own_docs_empresa" ON public.documentos_empresa FOR DELETE USING (empresa_id = get_user_empresa_id(auth.uid()) AND (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'administrador'::app_role)));

-- =============================================
-- DOCUMENTOS_TRABAJADOR
-- =============================================
CREATE TABLE IF NOT EXISTS public.documentos_trabajador (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  trabajador_id uuid NOT NULL REFERENCES public.trabajadores(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  tipo text,
  url text,
  fecha_vencimiento date,
  estado text NOT NULL DEFAULT 'vigente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.documentos_trabajador ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_docs_trabajador" ON public.documentos_trabajador FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "insert_own_docs_trabajador" ON public.documentos_trabajador FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "update_own_docs_trabajador" ON public.documentos_trabajador FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "delete_own_docs_trabajador" ON public.documentos_trabajador FOR DELETE USING (empresa_id = get_user_empresa_id(auth.uid()) AND (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'administrador'::app_role)));

-- =============================================
-- CARPETAS_SGSST
-- =============================================
CREATE TABLE IF NOT EXISTS public.carpetas_sgsst (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  orden integer DEFAULT 0,
  parent_id uuid REFERENCES public.carpetas_sgsst(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.carpetas_sgsst ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_carpetas" ON public.carpetas_sgsst FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "insert_own_carpetas" ON public.carpetas_sgsst FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "update_own_carpetas" ON public.carpetas_sgsst FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "delete_own_carpetas" ON public.carpetas_sgsst FOR DELETE USING (empresa_id = get_user_empresa_id(auth.uid()) AND (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'administrador'::app_role)));

-- =============================================
-- DOCUMENTOS_SGSST
-- =============================================
CREATE TABLE IF NOT EXISTS public.documentos_sgsst (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  carpeta_id uuid REFERENCES public.carpetas_sgsst(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  tipo text,
  url text,
  version integer DEFAULT 1,
  estado text NOT NULL DEFAULT 'borrador',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.documentos_sgsst ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_docs_sgsst" ON public.documentos_sgsst FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "insert_own_docs_sgsst" ON public.documentos_sgsst FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "update_own_docs_sgsst" ON public.documentos_sgsst FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "delete_own_docs_sgsst" ON public.documentos_sgsst FOR DELETE USING (empresa_id = get_user_empresa_id(auth.uid()) AND (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'administrador'::app_role)));

-- =============================================
-- FIRMAS_DOCUMENTOS
-- =============================================
CREATE TABLE IF NOT EXISTS public.firmas_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  documento_id uuid NOT NULL,
  documento_tipo text NOT NULL,
  firmante_id uuid,
  firmante_nombre text,
  firma_url text,
  firmado_en timestamptz,
  estado text NOT NULL DEFAULT 'pendiente',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.firmas_documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_firmas" ON public.firmas_documentos FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "insert_own_firmas" ON public.firmas_documentos FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "update_own_firmas" ON public.firmas_documentos FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));

-- =============================================
-- ACTIVOS
-- =============================================
CREATE TABLE IF NOT EXISTS public.activos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  tipo text,
  serial text,
  ubicacion text,
  asignado_a uuid REFERENCES public.trabajadores(id) ON DELETE SET NULL,
  estado text NOT NULL DEFAULT 'activo',
  fecha_adquisicion date,
  valor numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.activos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_activos" ON public.activos FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "insert_own_activos" ON public.activos FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "update_own_activos" ON public.activos FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "delete_own_activos" ON public.activos FOR DELETE USING (empresa_id = get_user_empresa_id(auth.uid()) AND (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'administrador'::app_role)));

-- =============================================
-- PLAN_MEJORA
-- =============================================
CREATE TABLE IF NOT EXISTS public.plan_mejora (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descripcion text,
  fecha_inicio date,
  fecha_fin date,
  responsable text,
  estado text NOT NULL DEFAULT 'abierto',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.plan_mejora ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_plan" ON public.plan_mejora FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "insert_own_plan" ON public.plan_mejora FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "update_own_plan" ON public.plan_mejora FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "delete_own_plan" ON public.plan_mejora FOR DELETE USING (empresa_id = get_user_empresa_id(auth.uid()) AND (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'administrador'::app_role)));

-- =============================================
-- ITEMS_PLAN_MEJORA
-- =============================================
CREATE TABLE IF NOT EXISTS public.items_plan_mejora (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plan_mejora(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  descripcion text NOT NULL,
  responsable text,
  fecha_limite date,
  estado text NOT NULL DEFAULT 'pendiente',
  evidencia_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.items_plan_mejora ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_items_plan" ON public.items_plan_mejora FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "insert_own_items_plan" ON public.items_plan_mejora FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "update_own_items_plan" ON public.items_plan_mejora FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "delete_own_items_plan" ON public.items_plan_mejora FOR DELETE USING (empresa_id = get_user_empresa_id(auth.uid()) AND (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'administrador'::app_role)));

-- =============================================
-- CONTRATISTAS
-- =============================================
CREATE TABLE IF NOT EXISTS public.contratistas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  nit text,
  contacto text,
  telefono text,
  email text,
  estado text NOT NULL DEFAULT 'activo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contratistas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_contratistas" ON public.contratistas FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "insert_own_contratistas" ON public.contratistas FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "update_own_contratistas" ON public.contratistas FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "delete_own_contratistas" ON public.contratistas FOR DELETE USING (empresa_id = get_user_empresa_id(auth.uid()) AND (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'administrador'::app_role)));

-- =============================================
-- EMPLEADOS_CONTRATISTA
-- =============================================
CREATE TABLE IF NOT EXISTS public.empleados_contratista (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contratista_id uuid NOT NULL REFERENCES public.contratistas(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nombres text NOT NULL,
  apellidos text NOT NULL,
  tipo_documento text NOT NULL DEFAULT 'CC',
  numero_documento text NOT NULL,
  cargo text,
  estado text NOT NULL DEFAULT 'pendiente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.empleados_contratista ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_emp_contratista" ON public.empleados_contratista FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "insert_own_emp_contratista" ON public.empleados_contratista FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "update_own_emp_contratista" ON public.empleados_contratista FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "delete_own_emp_contratista" ON public.empleados_contratista FOR DELETE USING (empresa_id = get_user_empresa_id(auth.uid()) AND (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'administrador'::app_role)));

-- =============================================
-- WHATSAPP_LOG
-- =============================================
CREATE TABLE IF NOT EXISTS public.whatsapp_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  trabajador_id uuid REFERENCES public.trabajadores(id) ON DELETE SET NULL,
  telefono text NOT NULL,
  mensaje text NOT NULL,
  tipo text DEFAULT 'saliente',
  estado text NOT NULL DEFAULT 'enviado',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_whatsapp" ON public.whatsapp_log FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "insert_own_whatsapp" ON public.whatsapp_log FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

-- =============================================
-- PAGOS
-- =============================================
CREATE TABLE IF NOT EXISTS public.pagos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  monto numeric NOT NULL,
  moneda text DEFAULT 'COP',
  concepto text,
  metodo_pago text,
  referencia text,
  estado text NOT NULL DEFAULT 'pendiente',
  fecha_pago timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_pagos" ON public.pagos FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "insert_own_pagos" ON public.pagos FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "update_own_pagos" ON public.pagos FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));

-- =============================================
-- ADD updated_at TRIGGERS FOR ALL NEW TABLES
-- =============================================
CREATE TRIGGER update_sedes_updated_at BEFORE UPDATE ON public.sedes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_perfil_socio_updated_at BEFORE UPDATE ON public.perfil_sociodemografico FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_capacitaciones_updated_at BEFORE UPDATE ON public.capacitaciones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accidentes_updated_at BEFORE UPDATE ON public.accidentes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ausencias_updated_at BEFORE UPDATE ON public.ausencias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_examenes_updated_at BEFORE UPDATE ON public.examenes_medicos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_docs_empresa_updated_at BEFORE UPDATE ON public.documentos_empresa FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_docs_trabajador_updated_at BEFORE UPDATE ON public.documentos_trabajador FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_carpetas_updated_at BEFORE UPDATE ON public.carpetas_sgsst FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_docs_sgsst_updated_at BEFORE UPDATE ON public.documentos_sgsst FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activos_updated_at BEFORE UPDATE ON public.activos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plan_mejora_updated_at BEFORE UPDATE ON public.plan_mejora FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_items_plan_updated_at BEFORE UPDATE ON public.items_plan_mejora FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contratistas_updated_at BEFORE UPDATE ON public.contratistas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_emp_contratista_updated_at BEFORE UPDATE ON public.empleados_contratista FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pagos_updated_at BEFORE UPDATE ON public.pagos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
