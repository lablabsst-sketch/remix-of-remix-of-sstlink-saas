import { cn } from "@/lib/utils";

interface SSTProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}

function getColor(percent: number) {
  if (percent >= 80) return "bg-secondary";
  if (percent >= 50) return "bg-primary";
  return "bg-destructive";
}

export function SSTProgressBar({ value, max = 100, label, className }: SSTProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-sm font-medium text-foreground">{Math.round(percent)}%</span>
        </div>
      )}
      <div className="w-full h-[5px] bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", getColor(percent))}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
