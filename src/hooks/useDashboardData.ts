import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardData {
  totalTrabajadores: number;
  trabajadoresAprobados: number;
  trabajadoresPendientes: number;
  totalContratistas: number;
  contratistas: { id: string; nombre: string; actividad: string | null; activo: boolean }[];
  accidentesAnio: number;
  diasPerdidosAnio: number;
  capacitacionesPendientes: number;
  capacitacionesCompletadas: number;
  docsProximosVencer: number;
  docsVencidos: number;
  nivelProteccion: number;
  itemsPlanMejora: { total: number; completados: number };
}

const empty: DashboardData = {
  totalTrabajadores: 0, trabajadoresAprobados: 0, trabajadoresPendientes: 0,
  totalContratistas: 0, contratistas: [], accidentesAnio: 0, diasPerdidosAnio: 0,
  capacitacionesPendientes: 0, capacitacionesCompletadas: 0,
  docsProximosVencer: 0, docsVencidos: 0, nivelProteccion: 0,
  itemsPlanMejora: { total: 0, completados: 0 },
};

export function useDashboardData(empresaId: string | null | undefined) {
  const [data, setData] = useState<DashboardData>(empty);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!empresaId) { setLoading(false); return; }

    const fetchAll = async () => {
      setLoading(true);
      const hoy = new Date();
      const inicioAnio = `${hoy.getFullYear()}-01-01`;
      const hoyStr = hoy.toISOString().split("T")[0];
      const en30Dias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const [
        { data: trabajadores },
        { data: contratistas },
        { data: accidentes },
        { data: caps },
        { data: docsEmp },
        { data: docsTrab },
        { data: planItems },
      ] = await Promise.all([
        supabase.from("trabajadores").select("id, estado").eq("empresa_id", empresaId).eq("eliminado", false),
        supabase.from("contratistas").select("id, nombre, actividad, activo").eq("empresa_id", empresaId).eq("activo", true).limit(5),
        supabase.from("accidentes").select("id, dias_perdidos").eq("empresa_id", empresaId).gte("fecha", inicioAnio),
        supabase.from("capacitaciones").select("id, estado").eq("empresa_id", empresaId),
        supabase.from("documentos_empresa").select("id, fecha_vencimiento").eq("empresa_id", empresaId).not("fecha_vencimiento", "is", null),
        supabase.from("documentos_trabajador").select("id, fecha_vencimiento").eq("empresa_id", empresaId).not("fecha_vencimiento", "is", null),
        supabase.from("items_plan_mejora").select("id, estado").eq("empresa_id", empresaId),
      ]);

      const totalTrabajadores = trabajadores?.length ?? 0;
      const trabajadoresAprobados = trabajadores?.filter(t => t.estado === "aprobado" || t.estado === "activo").length ?? 0;
      const trabajadoresPendientes = trabajadores?.filter(t => t.estado === "pendiente").length ?? 0;
      const accidentesAnio = accidentes?.length ?? 0;
      const diasPerdidosAnio = accidentes?.reduce((s, a) => s + (a.dias_perdidos ?? 0), 0) ?? 0;
      const capacitacionesPendientes = caps?.filter(c => c.estado === "pendiente").length ?? 0;
      const capacitacionesCompletadas = caps?.filter(c => c.estado === "completado").length ?? 0;
      const todosDocs = [...(docsEmp ?? []), ...(docsTrab ?? [])];
      const docsProximosVencer = todosDocs.filter(d => d.fecha_vencimiento >= hoyStr && d.fecha_vencimiento <= en30Dias).length;
      const docsVencidos = todosDocs.filter(d => d.fecha_vencimiento < hoyStr).length;
      const planTotal = planItems?.length ?? 0;
      const planCompletados = planItems?.filter(i => i.estado === "completado").length ?? 0;

      let nivel = 0;
      if (totalTrabajadores > 0) nivel += 25;
      if (accidentesAnio === 0 && totalTrabajadores > 0) nivel += 20;
      if (capacitacionesCompletadas > 0) nivel += 20;
      if (todosDocs.length > 0 && docsVencidos === 0) nivel += 20;
      if (planTotal > 0) nivel += 15;

      setData({
        totalTrabajadores, trabajadoresAprobados, trabajadoresPendientes,
        totalContratistas: contratistas?.length ?? 0,
        contratistas: contratistas ?? [],
        accidentesAnio, diasPerdidosAnio,
        capacitacionesPendientes, capacitacionesCompletadas,
        docsProximosVencer, docsVencidos,
        nivelProteccion: nivel,
        itemsPlanMejora: { total: planTotal, completados: planCompletados },
      });
      setLoading(false);
    };

    fetchAll();
  }, [empresaId]);

  return { data, loading };
}
