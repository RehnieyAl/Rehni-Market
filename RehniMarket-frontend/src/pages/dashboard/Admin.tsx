import { useSearchParams } from "react-router-dom";

import DashboardLayout from "@/shared/components/dashboard/DashboardLayout";

import { dashboardNavigation } from "@/shared/config/dashboardNavigation";
import { useRole } from "@/hooks/useRole";

import Home from "@/features/admin/components/dashboard/Home";
import Companies from "@/features/admin/components/dashboard/company/Companies";
import Users from "@/features/admin/components/dashboard/user/Users";
import CatalogManagement from "@/features/admin/components/dashboard/CatalogManagement";
import Advertisements from "@/features/admin/components/dashboard/advertisement/Advertisements";
import AdminPayouts from "@/features/admin/components/dashboard/payout/AdminPayouts";
import RehniCoin from "@/features/admin/components/dashboard/wallet/RehniCoin";
import Reports from "@/features/admin/components/dashboard/report/Reports";
import AccountSettings from "@/features/public/auth/components/AccountSettings";

// Mismo patrón que pages/user/Dashboard.tsx: la pestaña activa se deriva
// de la URL (?tab=...) en vez de un useState aparte, para poder
// deep-linkear una sección puntual sin crear
// ninguna ruta nueva - el click del sidebar solo actualiza la URL.
const VALID_TABS = [
  "home",
  "companies",
  "users",
  "products",
  "hero",
  "reports",
  "payouts",
  "wallet",
  "account",
];

export default function Admin() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isOwner } = useRole();

  const tab = searchParams.get("tab");
  const view = tab && VALID_TABS.includes(tab) ? tab : "home";

  const handleViewChange = (id: string) => {
    setSearchParams(id === "home" ? {} : { tab: id });
  };

  const views = {
    home: <Home onNavigate={handleViewChange} />,
    companies: <Companies />,
    users: <Users />,
    products: <CatalogManagement />,
    hero: <Advertisements />,
    reports: <Reports />,
    payouts: <AdminPayouts />,
    wallet: <RehniCoin />,
    account: <AccountSettings />,
  };

  return (
    <DashboardLayout
      navItems={isOwner ? dashboardNavigation.owner : dashboardNavigation.admin}
      activeItem={view}
      onNavigate={handleViewChange}
      title={isOwner ? "Panel Propietario" : "Panel Administrador"}
      description="Administra la plataforma"
      roleName={isOwner ? "Propietario" : "Administrador"}
    >
      {views[view as keyof typeof views]}
    </DashboardLayout>
  );
}