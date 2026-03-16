import { cn } from "@/lib/utils";

interface Column {
  key: string;
  label: string;
}

interface SSTDataTableProps {
  columns: Column[];
  data: Record<string, string | number>[];
  className?: string;
}

export function SSTDataTable({ columns, data, className }: SSTDataTableProps) {
  return (
    <div className={cn("w-full overflow-auto rounded-xl border-[0.5px] border-border", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-dark text-primary-foreground">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wide">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              className={cn(
                "border-b border-border last:border-b-0",
                i % 2 === 0 ? "bg-surface" : "bg-background"
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-foreground">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
