import { useState } from "react";

import DashboardLayout from "@/shared/components/dashboard/DashboardLayout";
import Sidebar from "@/shared/components/dashboard/Sidebar";
import Topbar from "@/shared/components/dashboard/Topbar";

import { dashboardNavigation } from "@/shared/config/dashboardNavigation";
import { useRole } from "@/hooks/useRole";

import Home from "@/features/admin/components/dashboard/Home";
import Companies from "@/features/admin/components/dashboard/company/Companies";
import Users from "@/features/admin/components/dashboard/user/Users";
import CatalogManagement from "@/features/admin/components/dashboard/CatalogManagement";
import Advertisements from "@/features/admin/components/dashboard/advertisement/Advertisements";
import RehniCoin from "@/features/admin/components/dashboard/wallet/RehniCoin";
import AccountSettings from "@/features/public/auth/components/AccountSettings";

export default function Admin() {
  const [view, setView] = useState("home");
  const { isOwner } = useRole();

  const views = {
    home: <Home onNavigate={setView} />,
    companies: <Companies />,
    users: <Users />,
    products: <CatalogManagement />,
    hero: <Advertisements />,
    wallet: <RehniCoin />,
    account: <AccountSettings />,
  };

  return (
    <DashboardLayout
      sidebar={
        <Sidebar
          items={
            isOwner
              ? dashboardNavigation.owner
              : dashboardNavigation.admin
          }
          activeItem={view}
          onItemClick={setView}
        />
      }
      topbar={
        <Topbar
          title={
            isOwner ? "Panel Propietario" : "Panel Administrador"
          }
          description="Administra la plataforma"
          roleName={isOwner ? "Propietario" : "Administrador"}
        />
      }
    >
      {views[view as keyof typeof views]}
    </DashboardLayout>
  );
}