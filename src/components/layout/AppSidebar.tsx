import { LayoutDashboard, Users, ClipboardCheck, FileText, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Trabajadores", url: "/trabajadores", icon: Users },
  { title: "Tareas", url: "/tareas", icon: ClipboardCheck },
  { title: "Documentos", url: "/documentos", icon: FileText },
  { title: "Ajustes", url: "/ajustes", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-16 bg-surface border-r border-border items-center py-4 gap-2 shrink-0">
      {/* Logo */}
      <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center mb-4">
        <span className="text-primary-foreground font-medium text-sm">S</span>
      </div>

      {items.map((item) => {
        const isActive = location.pathname === item.url;
        return (
          <NavLink
            key={item.url}
            to={item.url}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-lg transition-colors",
              isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            title={item.title}
          >
            <item.icon className="w-[18px] h-[18px]" />
          </NavLink>
        );
      })}
    </aside>
  );
}
