import { Search, Bell, Menu, User, LogOut, Building2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "react-router-dom";
import { MobileNavSheet } from "./MobileNavSheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import logoSstlink from "@/assets/logo-sstlink.png";

interface TopBarProps {
  breadcrumbs?: string[];
}

export function TopBar({ breadcrumbs = ["Dashboard"] }: TopBarProps) {
  const { empresa, usuario, loading } = useAuth();
  const navigate = useNavigate();
  const companyName = empresa?.nombre ?? "Mi Empresa";
  const initials = usuario
    ? (usuario.nombre?.[0] ?? "") + (usuario.apellido?.[0] ?? "")
    : "U";
  const fullName = usuario
    ? `${usuario.nombre ?? ""} ${usuario.apellido ?? ""}`.trim() || "Usuario"
    : "Usuario";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <header className="h-14 bg-surface border-b-[0.5px] border-border flex items-center px-3 sm:px-4 gap-2 sm:gap-4 shrink-0">
      {/* Mobile: hamburger menu */}
      <div className="md:hidden">
        <MobileNavSheet
          trigger={
            <button
              type="button"
              aria-label="Abrir menú de navegación"
              className="w-11 h-11 -ml-2 flex items-center justify-center rounded-md text-foreground hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
          }
        />
      </div>

      {/* Mobile: logo as link */}
      <Link
        to="/dashboard"
        aria-label="Ir al inicio"
        className="md:hidden flex items-center min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
      >
        <img src={logoSstlink} alt="SSTLink" className="h-7 w-auto" />
      </Link>

      {/* Desktop: Breadcrumbs */}
      <nav aria-label="Ruta de navegación" className="hidden md:flex items-center gap-1.5 text-[13px] min-w-0">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-hint" aria-hidden="true">/</span>}
            <span
              className={i === breadcrumbs.length - 1 ? "text-foreground font-medium" : "text-muted-foreground"}
              aria-current={i === breadcrumbs.length - 1 ? "page" : undefined}
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      {/* Desktop: Search */}
      <div className="flex-1 max-w-md mx-auto hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-hint" aria-hidden="true" />
          <Input
            type="search"
            aria-label="Buscar trabajador o documento"
            placeholder="Buscar trabajador, documento..."
            className="pl-9 h-9 bg-background border-[0.5px] border-border text-sm rounded-lg"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
        {/* Notifications */}
        <button
          type="button"
          aria-label="Notificaciones"
          className="w-11 h-11 flex items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Bell className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Company pill (desktop) */}
        {loading ? (
          <Skeleton className="h-7 w-28 rounded-full hidden sm:block" />
        ) : (
          <div className="hidden sm:flex items-center gap-2 border-[0.5px] border-border rounded-full px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-secondary shrink-0" aria-hidden="true" />
            <span className="text-[12px] text-foreground font-medium truncate max-w-[140px]">
              {companyName}
            </span>
          </div>
        )}

        {/* Avatar with menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Menú de usuario, ${fullName}`}
              className="w-11 h-11 flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-accent text-accent-foreground text-[12px] font-medium">
                  {initials.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <p className="text-[13px] font-medium truncate">{fullName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{companyName}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="min-h-[40px]">
              <Link to="/empresa" className="flex items-center gap-2 cursor-pointer">
                <Building2 className="w-4 h-4" aria-hidden="true" />
                Mi empresa
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="min-h-[40px]">
              <Link to="/empresa" className="flex items-center gap-2 cursor-pointer">
                <User className="w-4 h-4" aria-hidden="true" />
                Mi perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="min-h-[40px] text-destructive focus:text-destructive cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
