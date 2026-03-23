import { LayoutDashboard, Users, Truck, CalendarRange, MoreHorizontal } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const items = [
  { title: "Inicio", url: "/", icon: LayoutDashboard },
  { title: "Empleados", url: "/empleados", icon: Users },
  { title: "Proveedores", url: "/proveedores", icon: Truck },
  { title: "Calendario", url: "/plan-anual", icon: CalendarRange },
  { title: "Más", url: "/ajustes", icon: MoreHorizontal },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t-[0.5px] border-border flex items-center justify-around h-14 z-50">
      {items.map((item) => {
        const isActive = location.pathname === item.url;
        return (
          <NavLink
            key={item.url}
            to={item.url}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] px-2",
              isActive ? "text-primary" : "text-hint"
            )}
          >
            <item.icon className="w-5 h-5" aria-hidden="true" />
            <span className="text-[9px] leading-tight font-medium">{item.title}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
