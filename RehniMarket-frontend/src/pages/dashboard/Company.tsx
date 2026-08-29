import { useSearchParams } from "react-router-dom";

import DashboardLayout from "@/shared/components/dashboard/DashboardLayout";
import Sidebar from "@/shared/components/dashboard/Sidebar";
import { dashboardNavigation } from "@/shared/config/dashboardNavigation";

import Topbar from "@/shared/components/dashboard/Topbar";

import Home from "@/features/company/components/dashboard/Home";
import Products from "@/features/company/components/dashboard/product/Products";
import Orders from "@/features/company/components/dashboard/Orders";
import Finance from "@/features/company/components/dashboard/Finance";
import MyCompany from "@/features/company/components/dashboard/MyCompany";
import Profile from "@/features/company/components/dashboard/Profile";

// Mismo patrón que pages/user/Dashboard.tsx: la pestaña activa se deriva
// de la URL (?tab=...) en vez de un useState aparte, para poder
// deep-linkear una sección puntual sin crear
// ninguna ruta nueva - el click del sidebar solo actualiza la URL.
const VALID_TABS = ["home", "products", "orders", "finance", "company", "profile"];

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = searchParams.get("tab");
  const view = tab && VALID_TABS.includes(tab) ? tab : "home";

  const handleViewChange = (id: string) => {
    setSearchParams(id === "home" ? {} : { tab: id });
  };

  const views = {
    home: <Home onNavigate={handleViewChange} />,
    products: <Products />,
    orders: <Orders />,
    finance: <Finance />,
    company: <MyCompany />,
    profile: <Profile />,
  };

  return (
    <DashboardLayout
      sidebar={
        <Sidebar
          items={dashboardNavigation.company}
          activeItem={view}
          onItemClick={handleViewChange}
        />
      }
      topbar={
        <Topbar
          title="Panel Empresa"
          description="Administra tu negicio"
          roleName="Empresa"
        />
      }
    >
      {views[view as keyof typeof views]}
    </DashboardLayout>
  );
}
