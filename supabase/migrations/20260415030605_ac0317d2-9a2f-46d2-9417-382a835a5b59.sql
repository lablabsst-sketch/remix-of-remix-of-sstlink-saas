
-- 1. PHVA Standards reference table
CREATE TABLE IF NOT EXISTS public.phva_estandares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL,
  nombre text NOT NULL,
  fase text NOT NULL, -- PLANEAR, HACER, VERIFICAR, ACTUAR
  grupo text NOT NULL,
  puntaje numeric NOT NULL DEFAULT 0,
  aplica_7 boolean NOT NULL DEFAULT false,
  aplica_21 boolean NOT NULL DEFAULT false,
  aplica_60 boolean NOT NULL DEFAULT false,
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.phva_estandares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read standards"
  ON public.phva_estandares FOR SELECT TO authenticated
  USING (true);

-- 2. Company standard level selection
CREATE TABLE IF NOT EXISTS public.empresa_estandares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nivel text NOT NULL DEFAULT '21',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(empresa_id)
);

ALTER TABLE public.empresa_estandares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_empresa_estandares" ON public.empresa_estandares
  FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "insert_own_empresa_estandares" ON public.empresa_estandares
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "update_own_empresa_estandares" ON public.empresa_estandares
  FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE TRIGGER update_empresa_estandares_updated_at
  BEFORE UPDATE ON public.empresa_estandares
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Documents per standard per company
CREATE TABLE IF NOT EXISTS public.docs_estandar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  estandar_id uuid NOT NULL REFERENCES public.phva_estandares(id) ON DELETE CASCADE,
  doc_url text,
  doc_nombre text,
  doc_subido_en timestamptz,
  plantilla_url text,
  plantilla_nombre text,
  plantilla_subido_en timestamptz,
  estado text NOT NULL DEFAULT 'sin_iniciar',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, estandar_id)
);

ALTER TABLE public.docs_estandar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_docs_estandar" ON public.docs_estandar
  FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "insert_own_docs_estandar" ON public.docs_estandar
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "update_own_docs_estandar" ON public.docs_estandar
  FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "delete_own_docs_estandar" ON public.docs_estandar
  FOR DELETE USING (empresa_id = get_user_empresa_id(auth.uid())
    AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'administrador'::app_role)));

CREATE TRIGGER update_docs_estandar_updated_at
  BEFORE UPDATE ON public.docs_estandar
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. RPC: get_cumplimiento_phva
CREATE OR REPLACE FUNCTION public.get_cumplimiento_phva(p_empresa_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _nivel text;
  _result jsonb;
  _fases jsonb;
  _total int;
  _completados int;
BEGIN
  SELECT nivel INTO _nivel FROM empresa_estandares WHERE empresa_id = p_empresa_id;
  IF _nivel IS NULL THEN _nivel := '21'; END IF;

  WITH filtered AS (
    SELECT pe.id, pe.fase, pe.codigo,
      COALESCE(de.estado, 'sin_iniciar') as estado
    FROM phva_estandares pe
    LEFT JOIN docs_estandar de ON de.estandar_id = pe.id AND de.empresa_id = p_empresa_id
    WHERE
      CASE _nivel
        WHEN '7' THEN pe.aplica_7
        WHEN '21' THEN pe.aplica_21
        WHEN '60' THEN pe.aplica_60
        ELSE true
      END
  ),
  por_fase AS (
    SELECT fase,
      count(*) as total,
      count(*) FILTER (WHERE estado = 'completado') as completados,
      count(*) FILTER (WHERE estado = 'en_progreso') as en_progreso
    FROM filtered
    GROUP BY fase
  )
  SELECT jsonb_agg(jsonb_build_object(
    'fase', fase,
    'total', total,
    'completados', completados,
    'en_progreso', en_progreso,
    'porcentaje', CASE WHEN total > 0 THEN round((completados::numeric / total) * 100) ELSE 0 END
  ))
  INTO _fases
  FROM por_fase;

  SELECT count(*), count(*) FILTER (WHERE estado = 'completado')
  INTO _total, _completados
  FROM (
    SELECT COALESCE(de.estado, 'sin_iniciar') as estado
    FROM phva_estandares pe
    LEFT JOIN docs_estandar de ON de.estandar_id = pe.id AND de.empresa_id = p_empresa_id
    WHERE CASE _nivel
      WHEN '7' THEN pe.aplica_7
      WHEN '21' THEN pe.aplica_21
      WHEN '60' THEN pe.aplica_60
      ELSE true
    END
  ) sub;

  _result := jsonb_build_object(
    'porcentaje', CASE WHEN _total > 0 THEN round((_completados::numeric / _total) * 100) ELSE 0 END,
    'total', _total,
    'completados', _completados,
    'nivel', _nivel,
    'fases', COALESCE(_fases, '[]'::jsonb)
  );

  RETURN _result;
END;
$$;

-- 5. Storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Auth users can upload docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos');

CREATE POLICY "Auth users can read own docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documentos');

CREATE POLICY "Auth users can delete own docs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documentos');

-- 6. Seed initial PHVA standards (21 estándares base)
INSERT INTO public.phva_estandares (codigo, nombre, fase, grupo, puntaje, aplica_7, aplica_21, aplica_60, orden) VALUES
-- PLANEAR
('1.1.1', 'Responsable del SG-SST', 'PLANEAR', 'Recursos', 0.5, true, true, true, 1),
('1.1.2', 'Responsabilidades en SST', 'PLANEAR', 'Recursos', 0.5, false, true, true, 2),
('1.1.3', 'Asignación de recursos para el SG-SST', 'PLANEAR', 'Recursos', 0.5, false, true, true, 3),
('1.1.4', 'Afiliación al sistema de seguridad social integral', 'PLANEAR', 'Recursos', 0.5, true, true, true, 4),
('1.1.5', 'Pago de pensión de trabajadores de alto riesgo', 'PLANEAR', 'Recursos', 0.5, false, false, true, 5),
('1.1.6', 'Conformación COPASST / Vigía', 'PLANEAR', 'Recursos', 0.5, true, true, true, 6),
('1.1.7', 'Capacitación COPASST / Vigía', 'PLANEAR', 'Recursos', 0.5, false, true, true, 7),
('1.1.8', 'Conformación Comité de Convivencia', 'PLANEAR', 'Recursos', 0.5, true, true, true, 8),
('2.1.1', 'Política del SG-SST firmada y divulgada', 'PLANEAR', 'Gestión Integral', 1, true, true, true, 9),
('2.2.1', 'Objetivos definidos, claros y medibles', 'PLANEAR', 'Gestión Integral', 1, false, true, true, 10),
('2.3.1', 'Evaluación e identificación de prioridades', 'PLANEAR', 'Gestión Integral', 1, false, true, true, 11),
('2.4.1', 'Plan anual de trabajo', 'PLANEAR', 'Gestión Integral', 2, true, true, true, 12),
('2.5.1', 'Archivo y retención documental del SG-SST', 'PLANEAR', 'Gestión Integral', 2, false, true, true, 13),
('2.6.1', 'Rendición de cuentas', 'PLANEAR', 'Gestión Integral', 1, false, true, true, 14),
('2.7.1', 'Matriz legal', 'PLANEAR', 'Gestión Integral', 2, false, true, true, 15),
('2.8.1', 'Mecanismos de comunicación', 'PLANEAR', 'Gestión Integral', 1, false, true, true, 16),
('2.9.1', 'Identificación y evaluación para adquisiciones', 'PLANEAR', 'Gestión Integral', 1, false, false, true, 17),
('2.10.1', 'Evaluación y selección de proveedores y contratistas', 'PLANEAR', 'Gestión Integral', 2, false, true, true, 18),
('2.11.1', 'Gestión del cambio', 'PLANEAR', 'Gestión Integral', 1, false, false, true, 19),
-- HACER
('3.1.1', 'Evaluación médica ocupacional', 'HACER', 'Gestión de la Salud', 1, true, true, true, 20),
('3.1.2', 'Actividades de promoción y prevención en salud', 'HACER', 'Gestión de la Salud', 1, false, true, true, 21),
('3.1.3', 'Información al médico de los perfiles de cargo', 'HACER', 'Gestión de la Salud', 1, false, true, true, 22),
('3.1.4', 'Realización de exámenes médicos', 'HACER', 'Gestión de la Salud', 1, false, false, true, 23),
('3.1.5', 'Custodia de historias clínicas', 'HACER', 'Gestión de la Salud', 1, false, true, true, 24),
('3.1.6', 'Restricciones y recomendaciones médico-laborales', 'HACER', 'Gestión de la Salud', 1, false, true, true, 25),
('3.1.7', 'Estilos de vida y entornos saludables', 'HACER', 'Gestión de la Salud', 1, false, true, true, 26),
('3.1.8', 'Agua potable, servicios sanitarios y disposición de basuras', 'HACER', 'Gestión de la Salud', 1, false, false, true, 27),
('3.1.9', 'Eliminación adecuada de residuos', 'HACER', 'Gestión de la Salud', 1, false, false, true, 28),
('3.2.1', 'Reporte de accidentes de trabajo y enfermedades laborales', 'HACER', 'Gestión de la Salud', 2, true, true, true, 29),
('3.2.2', 'Investigación de accidentes e incidentes', 'HACER', 'Gestión de la Salud', 2, false, true, true, 30),
('3.2.3', 'Registro y análisis estadístico de accidentes', 'HACER', 'Gestión de la Salud', 1, false, true, true, 31),
('3.3.1', 'Medición de frecuencia de incidentes, AT y EL', 'HACER', 'Gestión de la Salud', 1, false, true, true, 32),
('3.3.2', 'Medición de severidad de AT y EL', 'HACER', 'Gestión de la Salud', 1, false, false, true, 33),
('3.3.3', 'Medición de mortalidad de AT y EL', 'HACER', 'Gestión de la Salud', 1, false, false, true, 34),
('3.3.4', 'Medición de prevalencia de incidentes, AT y EL', 'HACER', 'Gestión de la Salud', 1, false, false, true, 35),
('3.3.5', 'Medición de incidencia de incidentes, AT y EL', 'HACER', 'Gestión de la Salud', 1, false, false, true, 36),
('3.3.6', 'Medición de ausentismo por causa médica', 'HACER', 'Gestión de la Salud', 1, false, false, true, 37),
('4.1.1', 'Metodología para identificación de peligros y evaluación de riesgos', 'HACER', 'Gestión de Peligros y Riesgos', 4, false, true, true, 38),
('4.1.2', 'Identificación de peligros con participación de trabajadores', 'HACER', 'Gestión de Peligros y Riesgos', 4, true, true, true, 39),
('4.1.3', 'Identificación y priorización de naturaleza de peligros (metodología adicional)', 'HACER', 'Gestión de Peligros y Riesgos', 3, false, false, true, 40),
('4.1.4', 'Realización mediciones ambientales', 'HACER', 'Gestión de Peligros y Riesgos', 4, false, true, true, 41),
('4.2.1', 'Implementación medidas de prevención y control', 'HACER', 'Gestión de Peligros y Riesgos', 2.5, false, true, true, 42),
('4.2.2', 'Verificación de aplicación de medidas', 'HACER', 'Gestión de Peligros y Riesgos', 2.5, false, false, true, 43),
('4.2.3', 'Hay procedimientos e instructivos internos de SST', 'HACER', 'Gestión de Peligros y Riesgos', 2.5, false, false, true, 44),
('4.2.4', 'Inspecciones COPASST', 'HACER', 'Gestión de Peligros y Riesgos', 2.5, false, true, true, 45),
('4.2.5', 'Mantenimiento periódico de instalaciones y equipos', 'HACER', 'Gestión de Peligros y Riesgos', 2.5, false, true, true, 46),
('4.2.6', 'Entrega de EPP, verificación y capacitación', 'HACER', 'Gestión de Peligros y Riesgos', 2.5, false, true, true, 47),
('5.1.1', 'Plan de prevención y preparación ante emergencias', 'HACER', 'Gestión de Amenazas', 5, true, true, true, 48),
('5.1.2', 'Brigada de prevención conformada y capacitada', 'HACER', 'Gestión de Amenazas', 5, false, true, true, 49),
-- VERIFICAR
('6.1.1', 'Indicadores de estructura, proceso y resultado', 'VERIFICAR', 'Verificación del SG-SST', 1.25, false, true, true, 50),
('6.1.2', 'Auditoría anual del SG-SST', 'VERIFICAR', 'Verificación del SG-SST', 1.25, false, true, true, 51),
('6.1.3', 'Revisión por la alta dirección', 'VERIFICAR', 'Verificación del SG-SST', 1.25, false, true, true, 52),
('6.1.4', 'Planificación auditorías con COPASST', 'VERIFICAR', 'Verificación del SG-SST', 1.25, false, false, true, 53),
-- ACTUAR
('7.1.1', 'Acciones preventivas y correctivas con base en resultados del SG-SST', 'ACTUAR', 'Mejoramiento', 2.5, true, true, true, 54),
('7.1.2', 'Acciones de mejora conforme revisión de la alta dirección', 'ACTUAR', 'Mejoramiento', 2.5, false, true, true, 55),
('7.1.3', 'Acciones de mejora con base en investigaciones de AT y EL', 'ACTUAR', 'Mejoramiento', 2.5, false, true, true, 56),
('7.1.4', 'Plan de mejoramiento e implementación de medidas', 'ACTUAR', 'Mejoramiento', 2.5, false, true, true, 57);
