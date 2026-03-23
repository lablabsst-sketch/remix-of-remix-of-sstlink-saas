import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Users } from "lucide-react";

interface Props {
  loading: boolean;
}

function EmptyPanel({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Icon className="w-8 h-8 text-hint mb-2" aria-hidden="true" />
      <p className="text-[12px] text-muted-foreground">{text}</p>
    </div>
  );
}

export function DashboardPanels({ loading }: Props) {
  if (loading) {
    return (
      <div className="grid lg:grid-cols-[3fr_2fr] gap-3">
        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-[200px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[3fr_2fr] gap-3">
      {/* Contratistas panel */}
      <div className="bg-surface rounded-xl border-[0.5px] border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-medium text-foreground">Contratistas</h3>
          <button className="text-[11px] text-primary hover:underline">Ver todos →</button>
        </div>
        <EmptyPanel icon={Users} text="Sin contratistas. Invita al primero." />
      </div>

      {/* Tareas panel */}
      <div className="bg-surface rounded-xl border-[0.5px] border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-medium text-foreground">Tareas</h3>
          <button className="text-[11px] text-primary hover:underline">+ Nueva →</button>
        </div>
        <EmptyPanel icon={CheckCircle2} text="Estás al día con tus tareas" />
      </div>
    </div>
  );
}
