import {
  House,
  User,
  CirclePlus,
  Package,
  Truck,
  Store,
  Users,
  Building2,
  Megaphone,
  ShoppingBag,
  Heart,
  BarChart3,
} from "lucide-react";

import type { SidebarItem } from "../components/dashboard/Sidebar";

export type UserRole = "admin" | "company" | "user";

export const dashboardNavigation: Record<UserRole, SidebarItem[]> = {
  admin: [
    {
      id: "home",
      text: "Inicio",
      icon: <House size={22} />,
    },
    {
      id: "companies",
      text: "Empresas",
      icon: <Building2 size={22} />,
    },
    {
      id: "users",
      text: "Usuarios",
      icon: <Users size={22} />,
    },
    {
      id: "products",
      text: "Productos",
      icon: <Package size={22} />,
    },
    {
      id: "hero",
      text: "Hero",
      icon: <Megaphone size={22} />,
    },
    {
      id: "orders",
      text: "Pedidos",
      icon: <ShoppingBag size={22} />,
    },
    {
      id: "reports",
      text: "Reportes",
      icon: <BarChart3 size={22} />,
    },
  ],

  company: [
    {
      id: "home",
      text: "Inicio",
      icon: <House size={22} />,
    },
    {
      id: "products",
      text: "Productos",
      icon: <Package size={22} />,
    },
    {
      id: "orders",
      text: "Pedidos",
      icon: <CirclePlus size={22} />,
    },
    {
      id: "process-orders",
      text: "Procesar pedidos",
      icon: <Truck size={22} />,
    },
    {
      id: "company",
      text: "Mi tienda",
      icon: <Store size={22} />,
    },
    {
      id: "profile",
      text: "Mi perfil",
      icon: <User size={22} />,
    },
  ],

  user: [
    {
      id: "home",
      text: "Inicio",
      icon: <House size={22} />,
    },
    {
      id: "orders",
      text: "Mis pedidos",
      icon: <ShoppingBag size={22} />,
    },
    {
      id: "favorites",
      text: "Favoritos",
      icon: <Heart size={22} />,
    },
    {
      id: "profile",
      text: "Mi perfil",
      icon: <User size={22} />,
    },
  ],
};