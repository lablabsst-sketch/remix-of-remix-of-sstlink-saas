import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  title: string;
  dueDate?: string;
  isOverdue?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function TaskItem({ title, dueDate, isOverdue = false, checked = false, onCheckedChange }: TaskItemProps) {
  return (
    <div className="flex items-center gap-3 py-3 px-4 border-b border-border last:border-b-0">
      <Checkbox
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="rounded border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <span className={cn("flex-1 text-sm text-foreground", checked && "line-through text-muted-foreground")}>
        {title}
      </span>
      {dueDate && (
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] px-2 py-0.5 font-medium uppercase",
            isOverdue
              ? "border-destructive/30 text-destructive bg-destructive/10"
              : "border-primary/30 text-primary bg-accent"
          )}
        >
          {dueDate}
        </Badge>
      )}
    </div>
  );
}
