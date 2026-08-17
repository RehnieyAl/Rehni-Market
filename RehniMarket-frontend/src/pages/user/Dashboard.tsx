import { useSearchParams } from "react-router-dom";

import DashboardLayout from "@/shared/components/dashboard/DashboardLayout";
import Sidebar from "@/shared/components/dashboard/Sidebar";
import Topbar from "@/shared/components/dashboard/Topbar";

import { dashboardNavigation } from "@/shared/config/dashboardNavigation";

import Home from "@/features/user/components/dashboard/Home";
import Orders from "@/features/user/components/dashboard/Orders";
import Favorites from "@/features/user/components/dashboard/Favorites";
import Addresses from "@/features/user/components/dashboard/Addresses";
import AccountSettings from "@/features/public/auth/components/AccountSettings";

// Mismo patrón que pages/dashboard/Company.tsx: página delgada que solo
// arma el layout y cambia de vista - toda la lógica vive en
// features/user/components/dashboard/*.
const VALID_TABS = ["home", "orders", "favorites", "addresses", "profile"];

export default function Dashboard() {
  // La pestaña activa se deriva directamente de la URL (?tab=...), sin
  // duplicarla en un useState aparte: permite llegar directo a una
  // pestaña con /user/dashboard?tab=profile (ver ProfileDropdown.tsx >
  // "Mi perfil"/"Mi billetera"/"Configuración") sin crear ninguna ruta
  // nueva, y el click del sidebar solo actualiza la URL.
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = searchParams.get("tab");
  const view = tab && VALID_TABS.includes(tab) ? tab : "home";

  const handleViewChange = (id: string) => {
    setSearchParams(id === "home" ? {} : { tab: id });
  };

  const views = {
    home: <Home />,
    orders: <Orders />,
    favorites: <Favorites />,
    addresses: <Addresses />,
    profile: <AccountSettings />,
  };

  return (
    <DashboardLayout
      sidebar={
        <Sidebar
          items={dashboardNavigation.user}
          activeItem={view}
          onItemClick={handleViewChange}
        />
      }
      topbar={
        <Topbar
          title="Panel Comprador"
          description="Administra tu cuenta"
          roleName="Usuario"
        />
      }
    >
      {views[view as keyof typeof views]}
    </DashboardLayout>
  );
}
