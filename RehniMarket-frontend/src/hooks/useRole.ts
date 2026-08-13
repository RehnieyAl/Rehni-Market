import { useAuth } from "@/features/public/auth/context/useAuth";

export function useRole() {
  const { role } = useAuth();

  return {
    role,
    isAdmin: role === "admin",
    isCompany: role === "company",
    isUser: role === "user",
    isOwner: role === "owner",
    // OWNER hereda todas las capacidades de ADMIN: usar esta bandera en la
    // UI que hoy solo verifica isAdmin y que tambien debe mostrarse a owner.
    isAdminOrOwner: role === "admin" || role === "owner",
  };
}