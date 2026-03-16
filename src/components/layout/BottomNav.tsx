import { LayoutDashboard, Users, ClipboardCheck, FileText, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const items = [
  { title: "Inicio", url: "/", icon: LayoutDashboard },
  { title: "Equipo", url: "/trabajadores", icon: Users },
  { title: "Tareas", url: "/tareas", icon: ClipboardCheck },
  { title: "Docs", url: "/documentos", icon: FileText },
  { title: "Ajustes", url: "/ajustes", icon: Settings },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex items-center justify-around h-14 z-50">
      {items.map((item) => {
        const isActive = location.pathname === item.url;
        return (
          <NavLink
            key={item.url}
            to={item.url}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 min-w-0 px-2",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[9px] leading-tight font-medium">{item.title}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
