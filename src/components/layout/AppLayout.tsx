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
      {/* Skip link global (accesible en cualquier viewport) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:bg-foreground focus:text-background focus:px-3 focus:py-2 focus:rounded-md focus:text-sm"
      >
        Saltar al contenido principal
      </a>
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar breadcrumbs={breadcrumbs} />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-auto focus:outline-none"
        >
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
