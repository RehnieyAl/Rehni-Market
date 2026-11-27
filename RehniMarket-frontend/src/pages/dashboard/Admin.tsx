import { useSearchParams } from "react-router-dom";

import DashboardLayout from "@/shared/components/dashboard/DashboardLayout";

import {
  dashboardNavigation,
  OWNER_ONLY_NAV_IDS,
} from "@/shared/config/dashboardNavigation";
import { useRole } from "@/hooks/useRole";

import Home from "@/features/admin/components/dashboard/Home";
import Companies from "@/features/admin/components/dashboard/company/Companies";
import Users from "@/features/admin/components/dashboard/user/Users";
import CatalogManagement from "@/features/admin/components/dashboard/CatalogManagement";
import Advertisements from "@/features/admin/components/dashboard/advertisement/Advertisements";
import AdminPayouts from "@/features/admin/components/dashboard/payout/AdminPayouts";
import RehniCoin from "@/features/admin/components/dashboard/wallet/RehniCoin";
import Reports from "@/features/admin/components/dashboard/report/Reports";
import AdminReturns from "@/features/admin/components/dashboard/returns/AdminReturns";
import ShippingCarriers from "@/features/admin/components/dashboard/shipping/ShippingCarriers";
import AccountSettings from "@/features/public/auth/components/AccountSettings";
import SiteSettings from "@/features/admin/components/dashboard/site/SiteSettings";

const VALID_TABS = [
  "home",
  "companies",
  "users",
  "products",
  "hero",
  "reports",
  "returns",
  "carriers",
  "payouts",
  "wallet",
  "site",
  "account",
];

export default function Admin() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isOwner } = useRole();

  const tab = searchParams.get("tab");
  const requestedView = tab && VALID_TABS.includes(tab) ? tab : "home";

  const view =
    !isOwner && OWNER_ONLY_NAV_IDS.includes(requestedView) ? "home" : requestedView;

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
    returns: <AdminReturns />,
    carriers: <ShippingCarriers />,
    payouts: isOwner ? <AdminPayouts /> : null,
    wallet: <RehniCoin />,
    site: isOwner ? <SiteSettings /> : null,
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