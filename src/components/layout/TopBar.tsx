import { Search, Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface TopBarProps {
  breadcrumbs?: string[];
}

export function TopBar({ breadcrumbs = ["Dashboard"] }: TopBarProps) {
  const { empresa, usuario, loading } = useAuth();
  const companyName = empresa?.nombre ?? "Mi Empresa";
  const initials = usuario
    ? (usuario.nombre?.[0] ?? "") + (usuario.apellido?.[0] ?? "")
    : "U";

  return (
    <header className="h-14 bg-surface border-b-[0.5px] border-border flex items-center px-4 gap-4 shrink-0">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-[13px] min-w-0 hidden sm:flex">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-hint">/</span>}
            <span className={i === breadcrumbs.length - 1 ? "text-foreground font-medium" : "text-muted-foreground"}>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Mobile: logo */}
      <div className="sm:hidden flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-medium text-xs">S</span>
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-auto hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-hint" aria-hidden="true" />
          <Input
            placeholder="Buscar trabajador, documento..."
            className="pl-9 h-8 bg-background border-[0.5px] border-border text-sm rounded-lg"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Bell (mobile) */}
        <button className="sm:hidden w-8 h-8 flex items-center justify-center text-muted-foreground" aria-label="Notificaciones">
          <Bell className="w-5 h-5" />
        </button>

        {/* Company pill (desktop) */}
        {loading ? (
          <Skeleton className="h-7 w-28 rounded-full hidden sm:block" />
        ) : (
          <div className="hidden sm:flex items-center gap-2 border-[0.5px] border-border rounded-full px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
            <span className="text-[12px] text-foreground font-medium truncate max-w-[140px]">
              {companyName}
            </span>
          </div>
        )}

        {/* Avatar */}
        <Avatar className="w-[30px] h-[30px]">
          <AvatarFallback className="bg-accent text-accent-foreground text-[11px] font-medium">
            {initials.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
