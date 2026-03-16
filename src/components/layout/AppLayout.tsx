import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";

interface AppLayoutProps {
  children: ReactNode;
  breadcrumbs?: string[];
}

export function AppLayout({ children, breadcrumbs }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar breadcrumbs={breadcrumbs} />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-auto">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
