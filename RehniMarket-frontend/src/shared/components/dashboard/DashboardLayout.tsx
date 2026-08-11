import type { ReactNode } from "react";

interface DashboardLayoutProps {
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
}

export default function DashboardLayout({
  sidebar,
  topbar,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      {sidebar}

      <div className="flex flex-1 flex-col">
        {topbar}

        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}