import { useState } from "react";

import DashboardLayout from "@/shared/components/dashboard/DashboardLayout";
import Sidebar from "@/shared/components/dashboard/Sidebar";
import { dashboardNavigation } from "@/shared/config/dashboardNavigation";

import Topbar from "@/shared/components/dashboard/Topbar";

import Home from "@/features/company/components/dashboard/Home";
import Products from "@/features/company/components/dashboard/product/Products";
import Orders from "@/features/company/components/dashboard/Orders";
import ProcessOrders from "@/features/company/components/dashboard/ProcessOrders";
import MyCompany from "@/features/company/components/dashboard/MyCompany";
import Profile from "@/features/company/components/dashboard/Profile";



export default function Dashboard() {
  const [view, setView] = useState("home");

  const views = {
    home: <Home />,
    products: <Products />,
    orders: <Orders />,
    "process-orders": <ProcessOrders />,
    company: <MyCompany />,
    profile: <Profile />,
  };

  return (
    <DashboardLayout
      sidebar={
        <Sidebar
          items={dashboardNavigation.company}
          activeItem={view}
          onItemClick={setView}
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
