import { useAuth } from "../context/useAuth";

export function useRole() {
  const { role } = useAuth();

  return {
    role,
    isAdmin: role === "admin",
    isCompany: role === "company",
    isUser: role === "user",
  };
}