import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  icon: LucideIcon;
  iconColor?: string;
  value: number | string;
  label: string;
  className?: string;
}

export function MetricCard({ icon: Icon, iconColor = "text-primary", value, label, className }: MetricCardProps) {
  return (
    <div className={cn("bg-surface rounded-xl border-[0.5px] border-border p-4 flex items-center gap-3", className)}>
      <div className={cn("w-[30px] h-[30px] flex items-center justify-center", iconColor)}>
        <Icon className="w-[30px] h-[30px]" />
      </div>
      <div>
        <p className="text-[22px] font-medium leading-tight text-foreground">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}
