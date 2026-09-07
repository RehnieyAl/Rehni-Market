import { useSearchParams } from "react-router-dom";

import DashboardLayout from "@/shared/components/dashboard/DashboardLayout";
import { dashboardNavigation } from "@/shared/config/dashboardNavigation";

import Home from "@/features/company/components/dashboard/Home";
import Products from "@/features/company/components/dashboard/product/Products";
import Orders from "@/features/company/components/dashboard/Orders";
import Returns from "@/features/company/components/dashboard/Returns";
import Finance from "@/features/company/components/dashboard/Finance";
import MyCompany from "@/features/company/components/dashboard/MyCompany";
import Profile from "@/features/company/components/dashboard/Profile";

const VALID_TABS = ["home", "products", "orders", "returns", "finance", "company", "profile"];

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
    returns: <Returns />,
    finance: <Finance />,
    company: <MyCompany />,
    profile: <Profile />,
  };

  return (
    <DashboardLayout
      navItems={dashboardNavigation.company}
      activeItem={view}
      onNavigate={handleViewChange}
      title="Panel Empresa"
      description="Administra tu negocio"
      roleName="Empresa"
    >
      {views[view as keyof typeof views]}
    </DashboardLayout>
  );
}
