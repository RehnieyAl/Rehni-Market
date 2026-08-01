import { useState } from "react";

import Sidebar, {
  type DashboardView,
} from "../../components/company/Sidebar";

import Topbar from "../../components/company/Topbar";

import Home from "../../components/company/dashboard/Home";
import Products from "../../components/company/dashboard/product/Products";
import Orders from "../../components/company/dashboard/Orders";
import ProcessOrders from "../../components/company/dashboard/ProcessOrders";
import Company from "../../components/company/dashboard/Company";
import Profile from "../../components/company/dashboard/Profile";

export default function Dashboard() {
  const [view, setView] = useState<DashboardView>("home");

  const views = {
    home: <Home />,
    products: <Products />,
    orders: <Orders />,
    "process-orders": <ProcessOrders />,
    company: <Company />,
    profile: <Profile />,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">

      {/* Sidebar */}
      <Sidebar
        view={view}
        setView={setView}
      />


      {/* Zona derecha */}
      <div className="flex flex-1 flex-col">


        {/* Topbar */}
        <Topbar />


        {/* Contenido con scroll */}
        <main className="flex-1 overflow-y-auto p-8">

          {views[view]}

        </main>


      </div>

    </div>
  );
}