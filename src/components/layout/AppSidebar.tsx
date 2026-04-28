import {
  LayoutDashboard, Users, Truck, GraduationCap,
  ClipboardCheck, BarChart3, CalendarRange,
  Building2, MessageCircle, UserCheck, ShieldCheck,
  AlertTriangle, CalendarOff, Stethoscope,
  ChevronDown, LayoutGrid, HeartPulse, BookOpen,
  PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import logoSstlink from "@/assets/logo-sstlink.png";

const STORAGE_KEY = "sstlink:sidebar:expanded";

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

  // Ref al <nav> raíz para navegación con flechas entre todos los elementos focuseables
  const navRef = useRef<HTMLElement>(null);

  const focusables = () => {
    if (!navRef.current) return [] as HTMLElement[];
    return Array.from(
      navRef.current.querySelectorAll<HTMLElement>('[data-sidebar-focusable="true"]')
    ).filter((el) => !el.hasAttribute("disabled"));
  };

  const moveFocus = (current: HTMLElement, dir: 1 | -1) => {
    const items = focusables();
    const idx = items.indexOf(current);
    if (idx === -1) return;
    const next = items[(idx + dir + items.length) % items.length];
    next?.focus();
  };

  const handleNavKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (!target.matches('[data-sidebar-focusable="true"]')) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveFocus(target, 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveFocus(target, -1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusables()[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      const items = focusables();
      items[items.length - 1]?.focus();
    } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      // En toggles de categoría: → abre, ← cierra
      const catId = target.getAttribute("data-category-toggle");
      if (catId) {
        e.preventDefault();
        setOpenMap((prev) => ({ ...prev, [catId]: e.key === "ArrowRight" }));
      }
    }
  };

  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

  const renderItem = (item: NavItem) => {
    const isActive = location.pathname === item.url;
    return (
      <Tooltip key={item.url}>
        <TooltipTrigger asChild>
          <NavLink
            to={item.url}
            data-sidebar-focusable="true"
            aria-current={isActive ? "page" : undefined}
            aria-label={item.title}
            className={cn(
              "group w-10 h-10 flex items-center justify-center rounded-lg relative",
              "transition-all duration-200 ease-out",
              "hover:scale-125 hover:-translate-y-0.5 active:scale-110",
              focusRing,
              isActive
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-hint hover:bg-background hover:text-foreground"
            )}
          >
            <item.icon
              className="w-[18px] h-[18px] transition-transform duration-200 group-hover:scale-110"
              style={item.color ? { color: item.color } : undefined}
              aria-hidden="true"
            />
            {item.badge && (
              <>
                <span
                  className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-destructive"
                  aria-hidden="true"
                />
                <span className="sr-only">(novedades)</span>
              </>
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
    const headerId = `sidebar-cat-header-${cat.id}`;
    const panelId = `sidebar-cat-panel-${cat.id}`;

    return (
      <div
        key={cat.id}
        role="group"
        aria-labelledby={headerId}
        className="flex flex-col items-center w-full"
      >
        {/* Header / toggle de categoría */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              id={headerId}
              type="button"
              onClick={() => toggle(cat.id)}
              data-sidebar-focusable="true"
              data-category-toggle={cat.id}
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={`${cat.title}, ${open ? "contraer" : "expandir"} categoría`}
              className={cn(
                "group w-10 h-7 flex items-center justify-center rounded-md relative",
                "transition-all duration-200 ease-out",
                "text-hint/70 hover:text-foreground hover:bg-background",
                focusRing,
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
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          aria-hidden={!open}
          className={cn(
            "flex flex-col items-center gap-1 overflow-hidden transition-all duration-300 ease-out w-full",
            open ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0"
          )}
        >
          {/* Solo renderiza items cuando está abierta para evitar tab hacia elementos ocultos */}
          {open && cat.items.map(renderItem)}
        </div>

        {/* Separador sutil */}
        <div className="w-6 h-px bg-border/60 my-2" aria-hidden="true" />
      </div>
    );
  };

  return (
    <aside className="hidden md:flex flex-col w-16 bg-surface border-r-[0.5px] border-border items-center py-4 shrink-0 overflow-y-auto">
      {/* Skip link para saltar al contenido principal */}
      <a
        href="#main-content"
        className={cn(
          "sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50",
          "focus:bg-foreground focus:text-background focus:px-2 focus:py-1 focus:rounded"
        )}
      >
        Saltar al contenido
      </a>

      {/* Logo */}
      <img src={logoSstlink} alt="SSTLink" className="w-9 h-9 object-contain mb-4" />

      {/* Navegación principal */}
      <nav
        ref={navRef}
        aria-label="Navegación principal"
        onKeyDown={handleNavKeyDown}
        className="flex flex-col items-center flex-1 w-full"
      >
        {categories.map(renderCategory)}
      </nav>

      {/* Bottom nav */}
      <nav
        aria-label="Navegación secundaria"
        onKeyDown={handleNavKeyDown}
        className="flex flex-col items-center gap-1 mt-auto pt-2"
      >
        {bottomItems.map(renderItem)}
      </nav>
    </aside>
  );
}
