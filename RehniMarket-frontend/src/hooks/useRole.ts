import { useAuth } from "@/features/public/auth/context/useAuth";

export function useRole() {
  const { role, status } = useAuth();

  return {
    role,
    status,
    isAdmin: role === "admin",
    isCompany: role === "company",
    isUser: role === "user",
    isOwner: role === "owner",
    isAdminOrOwner: role === "admin" || role === "owner",
  };
}