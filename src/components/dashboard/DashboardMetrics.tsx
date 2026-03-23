import { Users, Briefcase, TrendingUp, CalendarClock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCountUp } from "@/hooks/useCountUp";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  loading: boolean;
  empresa: { num_empleados_directos: number | null; tiene_contratistas: boolean | null } | null;
}

function AnimatedMetric({
  icon: Icon,
  iconBg,
  iconColor,
  value,
  suffix,
  label,
  trend,
  trendColor,
  emptyText,
  emptyAction,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  value: number;
  suffix?: string;
  label: string;
  trend?: string;
  trendColor?: string;
  emptyText?: string;
  emptyAction?: string;
}) {
  const animated = useCountUp(value);
  const isEmpty = value === 0 && emptyText;

  return (
    <div className="bg-surface rounded-xl border-[0.5px] border-border p-3.5 hover:border-muted-foreground/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0" style={{ background: iconBg }}>
          <Icon className="w-[14px] h-[14px]" style={{ color: iconColor }} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          {isEmpty ? (
            <div className="space-y-1.5">
              <p className="text-[11px] text-muted-foreground">{emptyText}</p>
              {emptyAction && (
                <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 rounded-md border-border">
                  {emptyAction}
                </Button>
              )}
            </div>
          ) : (
            <>
              <p className="text-[22px] font-medium leading-tight text-foreground">
                {animated}{suffix}
              </p>
              <p className="text-[11px] text-hint mt-0.5">{label}</p>
              {trend && (
                <p className={cn("text-[11px] mt-0.5")} style={{ color: trendColor }}>
                  {trend}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function DashboardMetrics({ loading, empresa }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-[80px] rounded-xl" />
        ))}
      </div>
    );
  }

  const trabajadores = empresa?.num_empleados_directos ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
      <AnimatedMetric
        icon={Users}
        iconBg="#FFF3EE"
        iconColor="#FF6B2C"
        value={trabajadores}
        label="Trabajadores activos"
        trend={trabajadores > 0 ? `${trabajadores} aprobados` : undefined}
        trendColor="#16A34A"
        emptyText="Aún sin trabajadores registrados"
        emptyAction="Agregar"
      />
      <AnimatedMetric
        icon={Briefcase}
        iconBg="#FFF7ED"
        iconColor="#F59E0B"
        value={0}
        label="Contratistas"
        emptyText="Sin contratistas registrados"
        emptyAction="Agregar"
      />
      <AnimatedMetric
        icon={TrendingUp}
        iconBg="#F0FDF4"
        iconColor="#16A34A"
        value={0}
        suffix="%"
        label="Cumplimiento SGSST"
        emptyText="Sin documentos cargados"
        emptyAction="Ir a Documentos"
      />
      <AnimatedMetric
        icon={CalendarClock}
        iconBg="#FEF2F2"
        iconColor="#EF4444"
        value={0}
        label="Docs por vencer"
        emptyText="Todo al día"
        trendColor="#16A34A"
      />
    </div>
  );
}
