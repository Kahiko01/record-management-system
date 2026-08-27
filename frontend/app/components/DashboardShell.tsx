"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // 🛡️ Public routes without sidebar/topbar
  const publicRoutes = ["/login", "/verify", "/"];
  const isPublicRoute = publicRoutes.includes(pathname);
  
  if (isPublicRoute) {
    return <>{children}</>;
  }
  
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Full-Width TopBar - Spans the entire screen, starting at the farthest left */}
      <header className="sticky top-0 z-50 w-full shadow-sm">
        <TopBar />
      </header>
      
      {/* Main Layout: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Sits below the TopBar, full height of remaining space */}
        <aside className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 overflow-y-auto">
          <Sidebar />
        </aside>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}
