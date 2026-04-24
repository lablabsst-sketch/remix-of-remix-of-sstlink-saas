import {
  LayoutDashboard, Users, Truck, GraduationCap,
  ClipboardCheck, BarChart3, FileText, CalendarRange,
  Building2, MessageCircle, UserCheck, ShieldCheck,
  AlertTriangle, CalendarOff, Stethoscope, CalendarDays
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import logoSstlink from "@/assets/logo-sstlink.png";

const mainItems = [
  { title: "Inicio", url: "/dashboard", icon: LayoutDashboard },
  { title: "SG-SST", url: "/sgsst", icon: ShieldCheck },
  { title: "Trabajadores", url: "/trabajadores", icon: Users },
  { title: "Clientes", url: "/clientes", icon: UserCheck },
  { title: "Proveedores", url: "/proveedores", icon: Truck, badge: true },
  { title: "Accidentalidad", url: "/accidentalidad", icon: AlertTriangle },
  { title: "Ausentismo", url: "/ausentismo", icon: CalendarOff },
  { title: "Exámenes Médicos", url: "/examenes-medicos", icon: Stethoscope },
  { title: "Capacitaciones", url: "/capacitaciones", icon: GraduationCap },
  { title: "Calendario", url: "/calendario", icon: CalendarDays },
  { title: "Inspecciones", url: "/inspecciones", icon: ClipboardCheck },
  { title: "Estadísticas", url: "/estadisticas", icon: BarChart3 },
  { title: "Documentos", url: "/documentos", icon: FileText },
  { title: "Plan Anual", url: "/plan-anual", icon: CalendarRange },
];

const bottomItems = [
  { title: "Mi Empresa", url: "/empresa", icon: Building2 },
  { title: "Soporte", url: "#soporte", icon: MessageCircle, color: "#22C55E" },
];

export function AppSidebar() {
  const location = useLocation();

  const renderItem = (item: typeof mainItems[0] & { badge?: boolean; color?: string }) => {
    const isActive = location.pathname === item.url;
    return (
      <Tooltip key={item.url}>
        <TooltipTrigger asChild>
          <NavLink
            to={item.url}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-lg transition-colors relative",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-hint hover:bg-background"
            )}
            aria-label={item.title}
          >
            <item.icon
              className="w-[18px] h-[18px]"
              style={item.color ? { color: item.color } : undefined}
              aria-hidden="true"
            />
            {item.badge && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-destructive" />
            )}
          </NavLink>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-foreground text-background text-[11px]">
          {item.title}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <aside className="hidden md:flex flex-col w-16 bg-surface border-r-[0.5px] border-border items-center py-4 gap-2 shrink-0">
      {/* Logo */}
      <img src={logoSstlink} alt="SSTLink" className="w-9 h-9 object-contain mb-4" />

      {/* Main nav */}
      <div className="flex flex-col items-center gap-1 flex-1">
        {mainItems.map(renderItem)}
      </div>

      {/* Bottom nav */}
      <div className="flex flex-col items-center gap-1 mt-auto">
        {bottomItems.map(renderItem)}
      </div>
    </aside>
  );
}
