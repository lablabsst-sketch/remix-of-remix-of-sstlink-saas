import { AppLayout } from "@/components/layout/AppLayout";
import { HeroCard } from "@/components/sst/HeroCard";
import { MetricCard } from "@/components/sst/MetricCard";
import { SSTProgressBar } from "@/components/sst/SSTProgressBar";
import { TaskItem } from "@/components/sst/TaskItem";
import { WorkerRow } from "@/components/sst/WorkerRow";
import { SSTDataTable } from "@/components/sst/SSTDataTable";
import { Users, ClipboardCheck, AlertTriangle, FileText } from "lucide-react";

const Index = () => {
  return (
    <AppLayout breadcrumbs={["SSTLink", "Dashboard"]}>
      <div className="space-y-6 max-w-5xl">
        {/* Hero */}
        <HeroCard companyName="Constructora Andina S.A.S" protectionLevel="Nivel III - Riesgo Alto" accidentCount={2} />

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard icon={Users} value={48} label="Trabajadores activos" iconColor="text-primary" />
          <MetricCard icon={ClipboardCheck} value={12} label="Tareas pendientes" iconColor="text-secondary" />
          <MetricCard icon={AlertTriangle} value={3} label="Incidentes mes" iconColor="text-destructive" />
          <MetricCard icon={FileText} value={85} label="Documentos SST" iconColor="text-muted-foreground" />
        </div>

        {/* Progress */}
        <div className="bg-surface rounded-xl border-[0.5px] border-border p-5 space-y-4">
          <h3 className="text-sm font-medium text-foreground">Cumplimiento SG-SST</h3>
          <SSTProgressBar value={72} label="Plan de trabajo anual" />
          <SSTProgressBar value={45} label="Capacitaciones" />
          <SSTProgressBar value={90} label="Exámenes médicos" />
        </div>

        {/* Two columns */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Tasks */}
          <div className="bg-surface rounded-xl border-[0.5px] border-border">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-medium text-foreground">Tareas próximas</h3>
            </div>
            <TaskItem title="Actualizar matriz de peligros" dueDate="18 Mar" />
            <TaskItem title="Inspección extintores planta 2" dueDate="15 Mar" isOverdue />
            <TaskItem title="Capacitación trabajo en alturas" dueDate="22 Mar" />
            <TaskItem title="Revisión COPASST mensual" dueDate="25 Mar" />
          </div>

          {/* Workers */}
          <div className="bg-surface rounded-xl border-[0.5px] border-border">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-medium text-foreground">Equipo SST</h3>
            </div>
            <WorkerRow name="Carlos Gómez" role="Responsable SST" status="aprobado" />
            <WorkerRow name="María López" role="Vigía COPASST" status="aprobado" />
            <WorkerRow name="Juan Pérez" role="Brigadista" status="pendiente" />
            <WorkerRow name="Ana Rodríguez" role="Auxiliar SST" status="pendiente" />
          </div>
        </div>

        {/* Data Table */}
        <SSTDataTable
          columns={[
            { key: "doc", label: "Documento" },
            { key: "tipo", label: "Tipo" },
            { key: "fecha", label: "Fecha" },
            { key: "estado", label: "Estado" },
          ]}
          data={[
            { doc: "Plan de emergencias", tipo: "Procedimiento", fecha: "2025-01-15", estado: "Vigente" },
            { doc: "Matriz de EPP", tipo: "Formato", fecha: "2025-02-20", estado: "Por revisar" },
            { doc: "Política SST", tipo: "Política", fecha: "2024-11-01", estado: "Vigente" },
            { doc: "Investigación AT-003", tipo: "Informe", fecha: "2025-03-10", estado: "En proceso" },
          ]}
        />
      </div>
    </AppLayout>
  );
};

export default Index;
