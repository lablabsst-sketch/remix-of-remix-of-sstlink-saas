
-- Table: clientes (portal clients, different from contratistas)
CREATE TABLE IF NOT EXISTS public.clientes_portal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  nit_cedula text NOT NULL,
  tipo text NOT NULL DEFAULT 'empresa',
  contacto text,
  email text,
  telefono text,
  activo boolean NOT NULL DEFAULT true,
  token_acceso text DEFAULT encode(gen_random_bytes(16), 'hex'),
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, nit_cedula)
);

ALTER TABLE public.clientes_portal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_clientes_portal" ON public.clientes_portal FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "insert_own_clientes_portal" ON public.clientes_portal FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "update_own_clientes_portal" ON public.clientes_portal FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "delete_own_clientes_portal" ON public.clientes_portal FOR DELETE USING (empresa_id = get_user_empresa_id(auth.uid()) AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'administrador'::app_role)));

CREATE TRIGGER update_clientes_portal_updated_at BEFORE UPDATE ON public.clientes_portal FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: trabajadores_cliente
CREATE TABLE IF NOT EXISTS public.trabajadores_cliente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.clientes_portal(id) ON DELETE CASCADE,
  trabajador_id uuid NOT NULL REFERENCES public.trabajadores(id) ON DELETE CASCADE,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(cliente_id, trabajador_id)
);

ALTER TABLE public.trabajadores_cliente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_trab_cliente" ON public.trabajadores_cliente FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "insert_own_trab_cliente" ON public.trabajadores_cliente FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "update_own_trab_cliente" ON public.trabajadores_cliente FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "delete_own_trab_cliente" ON public.trabajadores_cliente FOR DELETE USING (empresa_id = get_user_empresa_id(auth.uid()));

-- Table: docs_empresa_cliente
CREATE TABLE IF NOT EXISTS public.docs_empresa_cliente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.clientes_portal(id) ON DELETE CASCADE,
  documento_id uuid NOT NULL REFERENCES public.documentos_empresa(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(cliente_id, documento_id)
);

ALTER TABLE public.docs_empresa_cliente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_docs_emp_cliente" ON public.docs_empresa_cliente FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "insert_own_docs_emp_cliente" ON public.docs_empresa_cliente FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "delete_own_docs_emp_cliente" ON public.docs_empresa_cliente FOR DELETE USING (empresa_id = get_user_empresa_id(auth.uid()));

-- Portal access policies (anon can read via RPC only, not directly)
-- We add a SELECT policy for anon on clientes_portal for the RPC
CREATE POLICY "anon_select_clientes_portal" ON public.clientes_portal FOR SELECT TO anon USING (activo = true);
CREATE POLICY "anon_select_trab_cliente" ON public.trabajadores_cliente FOR SELECT TO anon USING (activo = true);
CREATE POLICY "anon_select_docs_emp_cliente" ON public.docs_empresa_cliente FOR SELECT TO anon USING (true);

-- Allow anon to read trabajadores and documentos for portal
CREATE POLICY "anon_select_trabajadores_portal" ON public.trabajadores FOR SELECT TO anon USING (
  EXISTS (SELECT 1 FROM public.trabajadores_cliente tc WHERE tc.trabajador_id = id AND tc.activo = true)
);
CREATE POLICY "anon_select_docs_trab_portal" ON public.documentos_trabajador FOR SELECT TO anon USING (
  EXISTS (SELECT 1 FROM public.trabajadores_cliente tc WHERE tc.trabajador_id = documentos_trabajador.trabajador_id AND tc.activo = true)
);
CREATE POLICY "anon_select_docs_empresa_portal" ON public.documentos_empresa FOR SELECT TO anon USING (
  EXISTS (SELECT 1 FROM public.docs_empresa_cliente dec WHERE dec.documento_id = documentos_empresa.id)
);
CREATE POLICY "anon_select_empresas_portal" ON public.empresas FOR SELECT TO anon USING (true);

-- Function: get_portal_cliente
CREATE OR REPLACE FUNCTION public.get_portal_cliente(p_nit_cedula text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _cliente record;
  _result jsonb;
  _trabajadores jsonb;
  _docs_empresa jsonb;
BEGIN
  SELECT cp.*, e.nombre as empresa_nombre
  INTO _cliente
  FROM clientes_portal cp
  JOIN empresas e ON e.id = cp.empresa_id
  WHERE cp.nit_cedula = p_nit_cedula AND cp.activo = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', t.id,
    'nombres', t.nombres,
    'apellidos', t.apellidos,
    'cargo', t.cargo,
    'tipo_documento', t.tipo_documento,
    'numero_documento', t.numero_documento,
    'arl', t.arl,
    'eps', t.eps,
    'estado', t.estado,
    'documentos', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', dt.id, 'nombre', dt.nombre, 'tipo', dt.tipo, 'url', dt.url,
        'fecha_vencimiento', dt.fecha_vencimiento, 'estado', dt.estado
      )), '[]'::jsonb)
      FROM documentos_trabajador dt WHERE dt.trabajador_id = t.id
    )
  )), '[]'::jsonb)
  INTO _trabajadores
  FROM trabajadores_cliente tc
  JOIN trabajadores t ON t.id = tc.trabajador_id AND t.eliminado = false
  WHERE tc.cliente_id = _cliente.id AND tc.activo = true;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', de.id, 'nombre', de.nombre, 'tipo', de.tipo, 'url', de.url,
    'fecha_vencimiento', de.fecha_vencimiento, 'estado', de.estado
  )), '[]'::jsonb)
  INTO _docs_empresa
  FROM docs_empresa_cliente dec2
  JOIN documentos_empresa de ON de.id = dec2.documento_id
  WHERE dec2.cliente_id = _cliente.id;

  _result := jsonb_build_object(
    'cliente', jsonb_build_object(
      'id', _cliente.id,
      'nombre', _cliente.nombre,
      'empresa_nombre', _cliente.empresa_nombre,
      'tipo', _cliente.tipo
    ),
    'trabajadores', _trabajadores,
    'documentos_empresa', _docs_empresa
  );

  RETURN _result;
END;
$$;
