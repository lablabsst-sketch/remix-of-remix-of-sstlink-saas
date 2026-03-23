import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { DashboardPanels } from "@/components/dashboard/DashboardPanels";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { usuario, empresa, loading } = useAuth();
  const { toast } = useToast();
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!loading) {
      requestAnimationFrame(() => setEntered(true));
    }
  }, [loading]);

  useEffect(() => {
    if (!loading && !usuario && !empresa) {
      toast({
        title: "Error al cargar los datos",
        description: "Intenta recargar la página.",
        variant: "destructive",
      });
    }
  }, [loading, usuario, empresa]);

  const currentMonth = new Date().toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  const currentMonthUpper = new Date().toLocaleDateString("es-CO", { month: "short", year: "numeric" }).toUpperCase();

  const nombreCompleto = usuario
    ? `${usuario.nombre}${usuario.apellido ? " " + usuario.apellido : ""}`
    : null;

  return (
    <AppLayout breadcrumbs={["SSTLink", "Inicio"]}>
      <div
        className="space-y-3.5 max-w-6xl transition-all duration-300"
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? "translateY(0)" : "translateY(8px)",
        }}
      >
        {/* Hero */}
        {loading ? (
          <Skeleton className="h-[140px] w-full rounded-[14px]" />
        ) : (
          <DashboardHero
            empresaNombre={empresa?.nombre ?? "Sin empresa"}
            nombreCompleto={nombreCompleto ?? "Usuario"}
            numTrabajadores={empresa?.num_empleados_directos ?? 0}
            nivelProteccion={84}
            accidentes={0}
            mesAnio={currentMonthUpper}
            mesLabel={currentMonth}
          />
        )}

        {/* Metrics */}
        <DashboardMetrics loading={loading} empresa={empresa} />

        {/* Two-column panels */}
        <DashboardPanels loading={loading} />
      </div>
    </AppLayout>
  );
}
