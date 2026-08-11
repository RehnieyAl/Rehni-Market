import { useState } from "react";

import DashboardLayout from "@/shared/components/dashboard/DashboardLayout";
import Sidebar from "@/shared/components/dashboard/Sidebar";
import Topbar from "@/shared/components/dashboard/Topbar";

import { dashboardNavigation } from "@/shared/config/dashboardNavigation";

import Home from "@/features/admin/components/dashboard/Home";
import Companies from "@/features/admin/components/dashboard/company/Companies";
import Users from "@/features/admin/components/dashboard/user/Users";

export default function Admin() {
  const [view, setView] = useState("home");

  const views = {
    home: <Home onNavigate={setView} />,
    companies: <Companies />,
    users: <Users />,
  };

  return (
    <DashboardLayout
      sidebar={
        <Sidebar
          items={dashboardNavigation.admin}
          activeItem={view}
          onItemClick={setView}
        />
      }
      topbar={
        <Topbar
          title="Panel Administrador"
          description="Administra la plataforma"
          roleName="Administrador"
        />
      }
    >
      {views[view as keyof typeof views]}
    </DashboardLayout>
  );
}