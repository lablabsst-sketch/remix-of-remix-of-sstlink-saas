import { Users, Briefcase, TrendingUp, CalendarClock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCountUp } from "@/hooks/useCountUp";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DashboardData } from "@/hooks/useDashboardData";
import { useNavigate } from "react-router-dom";

interface Props { loading: boolean; data: DashboardData; }

function AnimatedMetric({ icon: Icon, iconBg, iconColor, value, suffix, label, trend, trendColor, emptyText, emptyAction, onAction }: {
  icon: React.ElementType; iconBg: string; iconColor: string; value: number; suffix?: string;
  label: string; trend?: string; trendColor?: string; emptyText?: string; emptyAction?: string; onAction?: () => void;
}) {
  const animated = useCountUp(value);
  const isEmpty = value === 0 && emptyText;
  return (
    <div className="bg-surface rounded-xl border-[0.5px] border-border p-3.5 hover:border-muted-foreground/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0" style={{ background: iconBg }}>
          <Icon className="w-[14px] h-[14px]" style={{ color: iconColor }} />
        </div>
        <div className="min-w-0">
          {isEmpty ? (
            <div className="space-y-1.5">
              <p className="text-[11px] text-muted-foreground">{emptyText}</p>
              {emptyAction && (
                <Button variant="outline" size="sm" onClick={onAction} className="h-6 text-[10px] px-2 rounded-md border-border">
                  {emptyAction}
                </Button>
              )}
            </div>
          ) : (
            <>
              <p className="text-[22px] font-medium leading-tight text-foreground">{animated}{suffix}</p>
              <p className="text-[11px] text-hint mt-0.5">{label}</p>
              {trend && <p className={cn("text-[11px] mt-0.5")} style={{ color: trendColor }}>{trend}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function DashboardMetrics({ loading, data }: Props) {
  const navigate = useNavigate();
  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
      {[1,2,3,4].map(i => <Skeleton key={i} className="h-[80px] rounded-xl" />)}
    </div>
  );

  const cumplimiento = data.itemsPlanMejora.total > 0
    ? Math.round((data.itemsPlanMejora.completados / data.itemsPlanMejora.total) * 100) : 0;
  const totalDocsAlerta = data.docsProximosVencer + data.docsVencidos;
  const alertaDocs = data.docsVencidos > 0 ? `${data.docsVencidos} vencidos` : data.docsProximosVencer > 0 ? `${data.docsProximosVencer} vencen pronto` : undefined;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
      <AnimatedMetric
        icon={Users} iconBg="#FFF3EE" iconColor="#FF6B2C"
        value={data.totalTrabajadores} label="Trabajadores activos"
        trend={data.trabajadoresAprobados > 0 ? `${data.trabajadoresAprobados} aprobados` : data.trabajadoresPendientes > 0 ? `${data.trabajadoresPendientes} pendientes` : undefined}
        trendColor={data.trabajadoresPendientes > 0 ? "#F59E0B" : "#16A34A"}
        emptyText="Aún sin trabajadores registrados" emptyAction="Agregar"
        onAction={() => navigate("/trabajadores")}
      />
      <AnimatedMetric
        icon={Briefcase} iconBg="#FFF7ED" iconColor="#F59E0B"
        value={data.totalContratistas} label="Contratistas activos"
        emptyText="Sin contratistas registrados" emptyAction="Agregar"
        onAction={() => navigate("/contratistas")}
      />
      <AnimatedMetric
        icon={TrendingUp} iconBg="#F0FDF4" iconColor="#16A34A"
        value={cumplimiento} suffix="%" label="Cumplimiento plan de mejora"
        trend={data.itemsPlanMejora.total > 0 ? `${data.itemsPlanMejora.completados}/${data.itemsPlanMejora.total} actividades` : undefined}
        trendColor="#16A34A"
        emptyText="Sin plan de mejora cargado" emptyAction="Crear plan"
      />
      <AnimatedMetric
        icon={CalendarClock} iconBg="#FEF2F2" iconColor="#EF4444"
        value={totalDocsAlerta} label="Documentos por atender"
        trend={alertaDocs} trendColor={data.docsVencidos > 0 ? "#EF4444" : "#F59E0B"}
        emptyText="Documentos al día ✓"
      />
    </div>
  );
}
