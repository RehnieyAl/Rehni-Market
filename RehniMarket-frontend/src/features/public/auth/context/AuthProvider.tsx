import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { getProfile } from "@/features/public/auth/api/authService";
import { clearTokens, clearAuthArtifacts } from "@/api/session";

import { AuthContext } from "./AuthContext";

import type {
  AuthContextType,
  AuthStatus,
  AuthUser,
  Role,
} from "@/features/public/auth/types/auth";

import type { TokenResponse } from "@/features/public/auth/types/response";

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

  const [role, setRole] = useState<Role | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const [status, setStatus] = useState<AuthStatus>(() =>
    localStorage.getItem("accessToken") ? "loading" : "unauthenticated"
  );

  const sessionRef = useRef(0);

  useEffect(() => {
    const session = ++sessionRef.current;

    const resolveSession = async () => {
      if (!accessToken) {
        setUser(null);
        setRole(null);
        setStatus("unauthenticated");
        return;
      }

      setStatus("loading");

      const profile = await getProfile().catch(() => null);

      if (session !== sessionRef.current) return;

      if (profile) {
        setUser(profile);
        setRole(profile.role);
        setStatus("authenticated");
        return;
      }

      clearTokens();
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      setRole(null);
      setStatus("unauthenticated");
    };

    resolveSession();

    return () => {
      sessionRef.current += 1;
    };
  }, [accessToken]);

  const refreshProfile = useCallback(async () => {
    if (!accessToken) return;

    const session = sessionRef.current;
    const profile = await getProfile().catch(() => null);

    if (!profile || session !== sessionRef.current) return;

    setUser(profile);
    setRole(profile.role);
    setStatus("authenticated");
  }, [accessToken]);

  const login = useCallback(async (data: TokenResponse) => {
    sessionRef.current += 1;

    setUser(null);
    setRole(data.role);
    setStatus("loading");

    localStorage.setItem("accessToken", data.access_token);
    localStorage.setItem("refreshToken", data.refresh_token);
    localStorage.removeItem("role");

    setAccessToken(data.access_token);
    setRefreshToken(data.refresh_token);
  }, []);

  const logout = useCallback(() => {
    sessionRef.current += 1;

    setAccessToken(null);
    setRefreshToken(null);
    setRole(null);
    setUser(null);
    setStatus("unauthenticated");

    clearTokens();
    clearAuthArtifacts();
  }, []);

  const value: AuthContextType = {
    status,
    accessToken,
    refreshToken,
    role,
    user,
    login,
    logout,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
