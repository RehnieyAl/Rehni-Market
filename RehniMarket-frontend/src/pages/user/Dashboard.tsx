/** Panel del comprador: navegación por pestañas (?tab=) entre inicio, pedidos, devoluciones, favoritos,
 * RehniCoin, direcciones y configuración de la cuenta. */
import { useSearchParams } from "react-router-dom";

import DashboardLayout from "@/shared/components/dashboard/DashboardLayout";
import { dashboardNavigation } from "@/shared/config/dashboardNavigation";

import Home from "@/features/user/components/dashboard/Home";
import Orders from "@/features/user/components/dashboard/Orders";
import Returns from "@/features/user/components/dashboard/Returns";
import Favorites from "@/features/user/components/dashboard/Favorites";
import Wallet from "@/features/user/components/dashboard/Wallet";
import Addresses from "@/features/user/components/dashboard/Addresses";
import AccountSettings from "@/features/public/auth/components/AccountSettings";

const VALID_TABS = ["home", "orders", "returns", "favorites", "wallet", "addresses", "profile"];

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = searchParams.get("tab");
  const view = tab && VALID_TABS.includes(tab) ? tab : "home";

  const handleViewChange = (id: string) => {
    setSearchParams(id === "home" ? {} : { tab: id });
  };

  const views = {
    home: <Home onNavigate={handleViewChange} />,
    orders: <Orders />,
    returns: <Returns />,
    favorites: <Favorites />,
    wallet: <Wallet />,
    addresses: <Addresses />,
    profile: <AccountSettings />,
  };

  return (
    <DashboardLayout
      navItems={dashboardNavigation.user}
      activeItem={view}
      onNavigate={handleViewChange}
      title="Panel Comprador"
      description="Administra tu cuenta"
      roleName="Usuario"
    >
      {views[view as keyof typeof views]}
    </DashboardLayout>
  );
}
