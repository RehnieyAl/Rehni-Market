import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { getProfile } from "@/features/public/auth/api/authService";

import { AuthContext } from "./AuthContext";

import type {
  AuthContextType,
  AuthUser,
} from "@/features/public/auth/types/auth";

import type {
  TokenResponse,
  Role,
} from "@/features/public/auth/types/response";


interface Props {
  children: ReactNode;
}


export function AuthProvider({ children }: Props) {

  const [accessToken, setAccessToken] = useState<string | null>(() =>
    localStorage.getItem("accessToken")
  );

  const [refreshToken, setRefreshToken] = useState<string | null>(() =>
    localStorage.getItem("refreshToken")
  );

  const [role, setRole] = useState<Role | null>(() => {
    const storedRole = localStorage.getItem("role");

    if (
      storedRole === "admin" ||
      storedRole === "company" ||
      storedRole === "user" ||
      storedRole === "owner"
    ) {
      return storedRole;
    }

    return null;
  });

  const [user, setUser] = useState<AuthUser | null>(null);


  useEffect(() => {
    const loadProfile = async () => {

      if (!accessToken) {
        setUser(null);
        setRole(null);
        return;
      }


      try {
        const profile = await getProfile();

        setUser(profile);
        setRole(profile.role);

      } catch (error) {
        console.error("Error cargando el perfil:", error);
      }

    };


    loadProfile();

  }, [accessToken]);


  const login = (data: TokenResponse) => {

    setAccessToken(data.access_token);
    setRefreshToken(data.refresh_token);
    setRole(data.role);


    localStorage.setItem(
      "accessToken",
      data.access_token
    );

    localStorage.setItem(
      "refreshToken",
      data.refresh_token
    );

    localStorage.setItem(
      "role",
      data.role
    );

  };


  const logout = () => {

    setAccessToken(null);
    setRefreshToken(null);
    setRole(null);
    setUser(null);


    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");

  };


  const value: AuthContextType = {
    accessToken,
    refreshToken,
    role,
    user,
    login,
    logout,
  };


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}