import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import * as SplashScreen from "expo-splash-screen";

import * as authService from "@/api/authService";
import { clearSession, getAccessToken, onSessionCleared, saveSession } from "@/api/session";

import { AuthContext } from "./AuthContext";
import type { AuthUser, LoginRequest, RegisterUserRequest } from "@/types/auth";

SplashScreen.preventAutoHideAsync().catch(() => {
});

interface Props {
  children: ReactNode;
}

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const profile = await authService.getProfile();
      setUser(profile);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      const token = await getAccessToken();

      if (!token) {
        if (!cancelled) {
          setUser(null);
          setIsLoading(false);
        }

        await SplashScreen.hideAsync();
        return;
      }

      try {
        const profile = await authService.getProfile();

        if (!cancelled) {
          setUser(profile);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }

        await SplashScreen.hideAsync();
      }
    };

    restore();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return onSessionCleared(() => {
      setUser(null);
    });
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const tokens = await authService.loginUser(data);

    await saveSession(tokens.access_token, tokens.refresh_token, tokens.role);

    const profile = await authService.getProfile();
    setUser(profile);

    return profile;
  }, []);

  const register = useCallback(async (data: RegisterUserRequest) => {
    return authService.registerUser(data);
  }, []);

  const logout = useCallback(async () => {
    await clearSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        isUser: user?.role === "user",
        login,
        register,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
