import { LayoutDashboard, Users, Truck, CalendarRange, MoreHorizontal } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { MobileNavSheet } from "./MobileNavSheet";

const items = [
  { title: "Inicio", url: "/dashboard", icon: LayoutDashboard },
  { title: "Trabajadores", url: "/trabajadores", icon: Users },
  { title: "Proveedores", url: "/proveedores", icon: Truck },
  { title: "Calendario", url: "/plan-anual", icon: CalendarRange },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav
      aria-label="Navegación inferior"
      className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t-[0.5px] border-border flex items-center justify-around h-16 z-50 pb-[env(safe-area-inset-bottom,0)]"
    >
      {items.map((item) => {
        const isActive = location.pathname === item.url;
        return (
          <NavLink
            key={item.url}
            to={item.url}
            aria-current={isActive ? "page" : undefined}
            aria-label={item.title}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] flex-1 px-2 rounded-md",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
              isActive ? "text-primary" : "text-hint"
            )}
          >
            <item.icon className="w-5 h-5" aria-hidden="true" />
            <span className="text-[10px] leading-tight font-medium">{item.title}</span>
          </NavLink>
        );
      })}

      {/* Más → abre el drawer con todos los módulos */}
      <MobileNavSheet
        trigger={
          <button
            type="button"
            aria-label="Abrir menú con todos los módulos"
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] flex-1 px-2 rounded-md text-hint",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
            )}
          >
            <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
            <span className="text-[10px] leading-tight font-medium">Más</span>
          </button>
        }
      />
    </nav>
  );
}
