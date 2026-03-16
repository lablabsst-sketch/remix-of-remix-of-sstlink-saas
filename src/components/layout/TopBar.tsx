import { Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

interface TopBarProps {
  breadcrumbs?: string[];
  companyName?: string;
}

export function TopBar({ breadcrumbs = ["Dashboard"], companyName = "Mi Empresa" }: TopBarProps) {
  return (
    <header className="h-14 bg-surface border-b border-border flex items-center px-4 gap-4 shrink-0">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-sm min-w-0">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-hint">/</span>}
            <span className={i === breadcrumbs.length - 1 ? "text-foreground font-medium" : "text-muted-foreground"}>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-auto hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-hint" />
          <Input
            placeholder="Buscar..."
            className="pl-9 h-9 bg-background border-border text-sm"
          />
        </div>
      </div>

      {/* Company + Avatar */}
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-sm text-muted-foreground hidden sm:inline">{companyName}</span>
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
            {companyName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
