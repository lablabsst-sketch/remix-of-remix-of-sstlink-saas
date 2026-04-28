import {
  LayoutDashboard, Users, Truck, GraduationCap,
  ClipboardCheck, BarChart3, CalendarRange,
  Building2, MessageCircle, UserCheck, ShieldCheck,
  AlertTriangle, CalendarOff, Stethoscope,
  ChevronDown, LayoutGrid, HeartPulse, BookOpen
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useRef, useState, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import logoSstlink from "@/assets/logo-sstlink.png";

type NavItem = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  badge?: boolean;
  color?: string;
};

type NavCategory = {
  id: string;
  title: string;
  icon: typeof LayoutDashboard;
  items: NavItem[];
};

const categories: NavCategory[] = [
  {
    id: "general",
    title: "General",
    icon: LayoutGrid,
    items: [
      { title: "Inicio", url: "/dashboard", icon: LayoutDashboard },
      { title: "SG-SST", url: "/sgsst", icon: ShieldCheck },
    ],
  },
  {
    id: "personas",
    title: "Personas",
    icon: Users,
    items: [
      { title: "Trabajadores", url: "/trabajadores", icon: Users },
      { title: "Clientes", url: "/clientes", icon: UserCheck },
      { title: "Proveedores", url: "/proveedores", icon: Truck, badge: true },
    ],
  },
  {
    id: "salud",
    title: "Salud y riesgos",
    icon: HeartPulse,
    items: [
      { title: "Accidentalidad", url: "/accidentalidad", icon: AlertTriangle },
      { title: "Ausentismo", url: "/ausentismo", icon: CalendarOff },
      { title: "Exámenes Médicos", url: "/examenes-medicos", icon: Stethoscope },
    ],
  },
  {
    id: "gestion",
    title: "Gestión",
    icon: BookOpen,
    items: [
      { title: "Capacitaciones", url: "/capacitaciones", icon: GraduationCap },
      { title: "Inspecciones", url: "/inspecciones", icon: ClipboardCheck },
      { title: "Estadísticas", url: "/estadisticas", icon: BarChart3 },
      { title: "Plan Anual", url: "/plan-anual", icon: CalendarRange },
    ],
  },
];

const bottomItems: NavItem[] = [
  { title: "Mi Empresa", url: "/empresa", icon: Building2 },
  { title: "Soporte", url: "#soporte", icon: MessageCircle, color: "#22C55E" },
];

export function AppSidebar() {
  const location = useLocation();

  // Categoría activa por ruta — para abrirla por defecto
  const activeCategoryId = categories.find((c) =>
    c.items.some((i) => i.url === location.pathname)
  )?.id;

  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() =>
    categories.reduce((acc, c) => {
      acc[c.id] = activeCategoryId ? c.id === activeCategoryId : c.id === "general";
      return acc;
    }, {} as Record<string, boolean>)
  );

  const toggle = (id: string) =>
    setOpenMap((prev) => ({ ...prev, [id]: !prev[id] }));

  const renderItem = (item: NavItem) => {
    const isActive = location.pathname === item.url;
    return (
      <Tooltip key={item.url}>
        <TooltipTrigger asChild>
          <NavLink
            to={item.url}
            className={cn(
              "group w-10 h-10 flex items-center justify-center rounded-lg relative",
              "transition-all duration-200 ease-out",
              "hover:scale-125 hover:-translate-y-0.5 active:scale-110",
              isActive
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-hint hover:bg-background hover:text-foreground"
            )}
            aria-label={item.title}
          >
            <item.icon
              className="w-[18px] h-[18px] transition-transform duration-200 group-hover:scale-110"
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

  const renderCategory = (cat: NavCategory) => {
    const open = openMap[cat.id];
    const hasActive = cat.items.some((i) => i.url === location.pathname);

    return (
      <div key={cat.id} className="flex flex-col items-center w-full">
        {/* Header / toggle de categoría */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => toggle(cat.id)}
              aria-expanded={open}
              aria-label={`${cat.title} (${open ? "ocultar" : "mostrar"})`}
              className={cn(
                "group w-10 h-7 flex items-center justify-center rounded-md relative",
                "transition-all duration-200 ease-out",
                "text-hint/70 hover:text-foreground hover:bg-background",
                hasActive && "text-foreground"
              )}
            >
              <cat.icon className="w-3.5 h-3.5" aria-hidden="true" />
              <ChevronDown
                className={cn(
                  "w-2.5 h-2.5 ml-0.5 transition-transform duration-200",
                  !open && "-rotate-90"
                )}
                aria-hidden="true"
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-foreground text-background text-[11px]">
            {cat.title}
          </TooltipContent>
        </Tooltip>

        {/* Items de la categoría */}
        <div
          className={cn(
            "flex flex-col items-center gap-1 overflow-hidden transition-all duration-300 ease-out w-full",
            open ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0"
          )}
        >
          {cat.items.map(renderItem)}
        </div>

        {/* Separador sutil */}
        <div className="w-6 h-px bg-border/60 my-2" />
      </div>
    );
  };

  return (
    <aside className="hidden md:flex flex-col w-16 bg-surface border-r-[0.5px] border-border items-center py-4 shrink-0 overflow-y-auto">
      {/* Logo */}
      <img src={logoSstlink} alt="SSTLink" className="w-9 h-9 object-contain mb-4" />

      {/* Categorías */}
      <div className="flex flex-col items-center flex-1 w-full">
        {categories.map(renderCategory)}
      </div>

      {/* Bottom nav */}
      <div className="flex flex-col items-center gap-1 mt-auto pt-2">
        {bottomItems.map(renderItem)}
      </div>
    </aside>
  );
}
