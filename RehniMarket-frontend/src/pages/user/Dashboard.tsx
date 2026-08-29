import { useSearchParams } from "react-router-dom";

import DashboardLayout from "@/shared/components/dashboard/DashboardLayout";
import Sidebar from "@/shared/components/dashboard/Sidebar";
import Topbar from "@/shared/components/dashboard/Topbar";

import { dashboardNavigation } from "@/shared/config/dashboardNavigation";

import Home from "@/features/user/components/dashboard/Home";
import Orders from "@/features/user/components/dashboard/Orders";
import Favorites from "@/features/user/components/dashboard/Favorites";
import Wallet from "@/features/user/components/dashboard/Wallet";
import Addresses from "@/features/user/components/dashboard/Addresses";
import AccountSettings from "@/features/public/auth/components/AccountSettings";

// Página delgada: arma el layout y cambia de vista; la lógica vive en features/user/components/dashboard.
const VALID_TABS = ["home", "orders", "favorites", "wallet", "addresses", "profile"];

export default function Dashboard() {
  // La pestaña activa se deriva de ?tab= en la URL, sin useState aparte: permite deep-links y el sidebar solo cambia la URL.
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
    wallet: <Wallet />,
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
