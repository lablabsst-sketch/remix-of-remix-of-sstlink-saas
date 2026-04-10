import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, BookOpen, CheckCircle2, Users } from "lucide-react";
import { DashboardData } from "@/hooks/useDashboardData";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface Props { loading: boolean; data: DashboardData; }

function StatusRow({ icon: Icon, label, value, okText, alertColor, okColor = "#6B7280", onClick }: {
  icon: React.ElementType; label: string; value: number;
  okText: string; alertColor: string; okColor?: string; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between py-2 border-b last:border-0 hover:opacity-80 transition-opacity text-left">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <span className="text-[11px] font-medium" style={{ color: value === 0 ? okColor : alertColor }}>
        {value === 0 ? okText : `${value} pendiente${value > 1 ? "s" : ""}`}
      </span>
    </button>
  );
}

export function DashboardPanels({ loading, data }: Props) {
  const navigate = useNavigate();
  if (loading) return (
    <div className="grid lg:grid-cols-[3fr_2fr] gap-3">
      <Skeleton className="h-[200px] rounded-xl" />
      <Skeleton className="h-[200px] rounded-xl" />
    </div>
  );

  return (
    <div className="grid lg:grid-cols-[3fr_2fr] gap-3">
      <div className="bg-surface rounded-xl border-[0.5px] border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-medium">Contratistas</h3>
          <button onClick={() => navigate("/contratistas")} className="text-[11px] text-primary hover:underline">Ver todos →</button>
        </div>
        {data.contratistas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="w-7 h-7 text-hint mb-2" />
            <p className="text-[12px] text-muted-foreground">Sin contratistas registrados.</p>
            <button onClick={() => navigate("/contratistas")} className="text-[11px] text-primary hover:underline mt-1">Agregar primero →</button>
          </div>
        ) : (
          <div className="space-y-1">
            {data.contratistas.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-[12px] font-medium">{c.nombre}</p>
                    {c.estado && <p className="text-[10px] text-muted-foreground">{c.estado}</p>}
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] h-5 border-emerald-200 text-emerald-700 bg-emerald-50">Activo</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-surface rounded-xl border-[0.5px] border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-medium">Estado SST</h3>
        </div>
        <div className="space-y-0.5">
          <StatusRow icon={BookOpen} label="Capacitaciones pendientes" value={data.capacitacionesPendientes} okText="Al día ✓" alertColor="#F59E0B" onClick={() => navigate("/capacitaciones")} />
          <StatusRow icon={AlertTriangle} label="Docs próximos a vencer" value={data.docsProximosVencer} okText="Sin alertas ✓" alertColor="#EF4444" onClick={() => navigate("/documentos")} />
          <StatusRow icon={CheckCircle2} label="Accidentes este año" value={data.accidentesAnio} okText="Sin accidentes ✓" alertColor="#EF4444" okColor="#16A34A" onClick={() => navigate("/accidentalidad")} />
          <StatusRow icon={CheckCircle2} label="Pendientes plan de mejora" value={data.itemsPlanMejora.total - data.itemsPlanMejora.completados} okText="Plan al día ✓" alertColor="#F59E0B" onClick={() => navigate("/plan-mejora")} />
        </div>
      </div>
    </div>
  );
}
