import {
  House,
  User,
  Package,
  Truck,
  Store,
  Users,
  Building2,
  Megaphone,
  Heart,
  BarChart3,
  MapPin,
  Settings,
  Coins,
  Wallet,
  Receipt,
} from "lucide-react";

import type { SidebarItem } from "../components/dashboard/Sidebar";

export type UserRole = "admin" | "company" | "user" | "owner";

// Navegación base del panel de administración. OWNER la reutiliza completa y suma sus opciones exclusivas.
const adminNavigation: SidebarItem[] = [
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
    text: "Catálogo",
    icon: <Package size={22} />,
  },
  {
    id: "hero",
    text: "Anuncios",
    icon: <Megaphone size={22} />,
  },
  {
    id: "reports",
    text: "Reportes",
    icon: <BarChart3 size={22} />,
  },
  {
    id: "payouts",
    text: "Liquidaciones",
    icon: <Receipt size={22} />,
  },
  {
    id: "wallet",
    text: "RehniCoin",
    icon: <Coins size={22} />,
  },
  {
    id: "account",
    text: "Configuración de cuenta",
    icon: <User size={22} />,
  },
];

// Opciones exclusivas de OWNER. Hoy vacío: la gestión de administradores vive dentro de la vista "Usuarios".
const ownerExclusiveNavigation: SidebarItem[] = [];

export const dashboardNavigation: Record<UserRole, SidebarItem[]> = {
  admin: adminNavigation,

  owner: [...adminNavigation, ...ownerExclusiveNavigation],

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
      icon: <Truck size={22} />,
    },
    {
      id: "finance",
      text: "Finanzas",
      icon: <Wallet size={22} />,
    },
    {
      id: "company",
      text: "Mi tienda",
      icon: <Store size={22} />,
    },
    {
      id: "profile",
      text: "Configuración de cuenta",
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
      icon: <Package size={22} />,
    },
    {
      id: "favorites",
      text: "Favoritos",
      icon: <Heart size={22} />,
    },
    {
      id: "wallet",
      text: "RehniCoins",
      icon: <Coins size={22} />,
    },
    {
      id: "addresses",
      text: "Direcciones",
      icon: <MapPin size={22} />,
    },
    {
      id: "profile",
      text: "Configuración de cuenta",
      icon: <Settings size={22} />,
    },
  ],
};