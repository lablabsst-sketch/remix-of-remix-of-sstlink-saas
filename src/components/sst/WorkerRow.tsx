import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WorkerRowProps {
  name: string;
  role: string;
  status: "aprobado" | "pendiente";
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export function WorkerRow({ name, role, status }: WorkerRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 px-4 border-b border-border last:border-b-0">
      <Avatar className="w-8 h-8">
        <AvatarFallback className="bg-muted text-foreground text-xs font-medium">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{name}</p>
        <p className="text-[11px] text-muted-foreground">{role}</p>
      </div>
      <Badge
        className={cn(
          "text-[10px] px-2 py-0.5 font-medium uppercase border-0",
          status === "aprobado"
            ? "bg-secondary/10 text-secondary"
            : "bg-primary/10 text-primary"
        )}
      >
        {status}
      </Badge>
    </div>
  );
}
