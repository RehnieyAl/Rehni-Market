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
} from "lucide-react";

import type { SidebarItem } from "../components/dashboard/Sidebar";

export type UserRole = "admin" | "company" | "user" | "owner";

// Navegación base del panel de administración. OWNER la reutiliza por
// completo (hereda todas las capacidades de ADMIN) y solo se le agregan
// las opciones exclusivas de OWNER a continuación.
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

// Opciones exclusivas de OWNER. Por ahora la unica capacidad exclusiva
// habilitada es la gestión de administradores, que vive dentro de la
// propia vista "Usuarios" (con permisos adicionales en esa pantalla), por
// lo que no hay todavía una entrada de menú nueva que agregar aquí. Este
// arreglo queda listo para sumar futuras secciones exclusivas de OWNER.
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