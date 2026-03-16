ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS sector_industria text,
  ADD COLUMN IF NOT EXISTS num_empleados_directos integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tiene_contratistas boolean DEFAULT false;