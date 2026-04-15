import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ShieldCheck } from "lucide-react";
import { EstandarRow } from "@/components/sgsst/EstandarRow";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const NIVELES = [
  { value: "7", label: "7 estándares" },
  { value: "21", label: "21 estándares" },
  { value: "60", label: "60 estándares" },
  { value: "personalizado", label: "Personalizado" },
];

const FASES = [
  { key: "PLANEAR", color: "#3B82F6", bg: "#EFF6FF" },
  { key: "HACER", color: "#F59E0B", bg: "#FFFBEB" },
  { key: "VERIFICAR", color: "#8B5CF6", bg: "#F5F3FF" },
  { key: "ACTUAR", color: "#22C55E", bg: "#F0FDF4" },
];

interface Estandar {
  id: string; codigo: string; nombre: string; fase: string; grupo: string;
  aplica_7: boolean; aplica_21: boolean; aplica_60: boolean; orden: number;
}

interface DocEstandar {
  id: string; estandar_id: string;
  doc_url: string | null; doc_nombre: string | null; doc_subido_en: string | null;
  plantilla_url: string | null; plantilla_nombre: string | null; plantilla_subido_en: string | null;
  estado: string;
}

interface FaseData { fase: string; total: number; completados: number; en_progreso: number; porcentaje: number; }
interface CumplimientoData { porcentaje: number; total: number; completados: number; nivel: string; fases: FaseData[]; }

export default function SGSST() {
  const { empresa } = useAuth();
  const empresaId = empresa?.id;

  const [nivel, setNivel] = useState<string>("21");
  const [estandares, setEstandares] = useState<Estandar[]>([]);
  const [docs, setDocs] = useState<DocEstandar[]>([]);
  const [cumplimiento, setCumplimiento] = useState<CumplimientoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openFases, setOpenFases] = useState<Record<string, boolean>>({ PLANEAR: true, HACER: false, VERIFICAR: false, ACTUAR: false });

  const fetchData = useCallback(async () => {
    if (!empresaId) return;
    setLoading(true);

    const [{ data: estData }, { data: nivelData }, { data: docsData }, { data: cumplData }] = await Promise.all([
      supabase.from("phva_estandares").select("*").order("orden"),
      supabase.from("empresa_estandares").select("nivel").eq("empresa_id", empresaId).maybeSingle(),
      supabase.from("docs_estandar").select("*").eq("empresa_id", empresaId),
      supabase.rpc("get_cumplimiento_phva", { p_empresa_id: empresaId }),
    ]);

    setEstandares((estData as Estandar[]) ?? []);
    setDocs((docsData as DocEstandar[]) ?? []);
    if (nivelData?.nivel) setNivel(nivelData.nivel);
    if (cumplData) setCumplimiento(cumplData as unknown as CumplimientoData);
    setLoading(false);
  }, [empresaId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleNivelChange = async (newNivel: string) => {
    if (!empresaId) return;
    setNivel(newNivel);
    const { error } = await supabase
      .from("empresa_estandares")
      .upsert({ empresa_id: empresaId, nivel: newNivel } as any, { onConflict: "empresa_id" });
    if (error) toast.error("Error al guardar nivel");
    else fetchData();
  };

  const filteredEstandares = estandares.filter(e => {
    if (nivel === "7") return e.aplica_7;
    if (nivel === "21") return e.aplica_21;
    if (nivel === "60") return e.aplica_60;
    return true;
  });

  const getDocForEstandar = (estandarId: string) => docs.find(d => d.estandar_id === estandarId) ?? null;
  const getFaseData = (fase: string) => cumplimiento?.fases?.find(f => f.fase === fase);

  const groupByGrupo = (items: Estandar[]) => {
    const groups: Record<string, Estandar[]> = {};
    items.forEach(e => {
      if (!groups[e.grupo]) groups[e.grupo] = [];
      groups[e.grupo].push(e);
    });
    return groups;
  };

  return (
    <AppLayout breadcrumbs={["SSTLink", "SG-SST"]}>
      <div className="space-y-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-[17px] font-medium">Sistema de Gestión SG-SST</h1>
            <p className="text-[12px] text-muted-foreground">Ciclo PHVA · Resolución 0312 de 2019</p>
          </div>
        </div>

        {/* Nivel selector */}
        <div className="bg-surface rounded-xl border-[0.5px] border-border p-4">
          <p className="text-[12px] font-medium mb-2">Nivel de estándares mínimos</p>
          <div className="flex flex-wrap gap-2">
            {NIVELES.map(n => (
              <Button key={n.value} variant={nivel === n.value ? "default" : "outline"}
                size="sm" className="h-8 text-[12px]" onClick={() => handleNivelChange(n.value)}>
                {n.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Progress cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-[90px] rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {FASES.map(f => {
              const data = getFaseData(f.key);
              return (
                <div key={f.key} className="bg-surface rounded-xl border-[0.5px] border-border p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-medium" style={{ color: f.color }}>{f.key}</span>
                    <span className="text-[18px] font-medium">{data?.porcentaje ?? 0}%</span>
                  </div>
                  <Progress value={data?.porcentaje ?? 0} className="h-1.5"
                    style={{ "--progress-color": f.color } as React.CSSProperties} />
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    {data?.completados ?? 0}/{data?.total ?? 0} completados
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Global */}
        {cumplimiento && (
          <div className="bg-surface rounded-xl border-[0.5px] border-border p-4 flex items-center gap-4">
            <span className="text-[36px] font-medium text-primary">{cumplimiento.porcentaje}%</span>
            <div>
              <p className="text-[13px] font-medium">Cumplimiento global</p>
              <p className="text-[11px] text-muted-foreground">{cumplimiento.completados}/{cumplimiento.total} estándares completados · Nivel: {cumplimiento.nivel} estándares</p>
            </div>
          </div>
        )}

        {/* PHVA Sections */}
        {loading ? (
          <Skeleton className="h-[300px] rounded-xl" />
        ) : (
          <div className="space-y-2">
            {FASES.map(f => {
              const faseItems = filteredEstandares.filter(e => e.fase === f.key);
              if (faseItems.length === 0) return null;
              const groups = groupByGrupo(faseItems);
              const isOpen = openFases[f.key];

              return (
                <Collapsible key={f.key} open={isOpen}
                  onOpenChange={(o) => setOpenFases(prev => ({ ...prev, [f.key]: o }))}>
                  <CollapsibleTrigger className="w-full">
                    <div className="bg-surface rounded-xl border-[0.5px] border-border p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: f.color }} />
                        <span className="text-[13px] font-medium">{f.key}</span>
                        <span className="text-[11px] text-muted-foreground">({faseItems.length} estándares)</span>
                      </div>
                      <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="bg-surface rounded-b-xl border-x-[0.5px] border-b-[0.5px] border-border px-4 pb-4 -mt-1">
                      {Object.entries(groups).map(([grupo, items]) => (
                        <div key={grupo} className="mt-3">
                          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">{grupo}</p>
                          {items.map(est => (
                            <EstandarRow key={est.id} estandar={est} empresaId={empresaId!}
                              doc={getDocForEstandar(est.id)} onUpdate={fetchData} />
                          ))}
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
