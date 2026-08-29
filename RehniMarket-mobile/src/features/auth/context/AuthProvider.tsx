import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import * as SplashScreen from "expo-splash-screen";

import * as authService from "@/api/authService";
import { clearSession, getAccessToken, onSessionCleared, saveSession } from "@/api/session";

import { AuthContext } from "./AuthContext";
import type { AuthUser, LoginRequest, RegisterUserRequest } from "@/types/auth";

// Se mantiene visible el splash nativo (en vez de un loading en JS que
// parpadearía) hasta que la restauración de sesión termine - ver Fase 3 >
// AUTH PROVIDER > "NO mostrar Login durante un instante mientras se
// restaura una sesión válida". Debe llamarse antes del primer render, acá
// en el scope del módulo.
SplashScreen.preventAutoHideAsync().catch(() => {
  // No-op: si ya se llamó antes (fast refresh en desarrollo) rechaza sin
  // que importe para el flujo real.
});

interface Props {
  children: ReactNode;
}

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vuelve a pedir GET /auth/me y sincroniza `user` - mismo propósito que
  // refreshProfile() en la web. Si falla, deja `user` en null: el 401 ya
  // pasó por el interceptor de client.ts (que intenta refresh solo y,
  // si falla, limpia SecureStore por su cuenta - ver
  // onSessionCleared más abajo).
  const refreshSession = useCallback(async () => {
    try {
      const profile = await authService.getProfile();
      setUser(profile);
    } catch {
      setUser(null);
    }
  }, []);

  // Restauración al arrancar (ver Fase 3 > AUTH PROVIDER, pasos 1-4):
  // sin token guardado, no autenticado, listo. Con token guardado, se
  // valida pidiendo el perfil real (no basta con que exista un token: si
  // está vencido y el refresh también falla, GET /auth/me termina
  // rechazando después de que el interceptor ya intentó renovarlo).
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

  // Reacciona a un logout forzado desde fuera de React (el interceptor de
  // refresh en client.ts llama clearSession() directamente cuando el
  // refresh falla) - sin esto, `user` seguiría con datos viejos aunque
  // SecureStore y la navegación ya se hayan resuelto (ver
  // api/session.ts > onSessionCleared).
  useEffect(() => {
    return onSessionCleared(() => {
      setUser(null);
    });
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    // Deliberadamente sin try/catch: la pantalla de Login es quien decide
    // qué hacer con cada código de error (EMAIL_NOT_VERIFIED redirige a
    // verify-email, el resto se muestra como alerta) - mismo reparto de
    // responsabilidades que Login.tsx en la web.
    //
    // NO se valida el role acá adentro: el backend ya autenticó
    // credenciales válidas sean del role que sean (ver Fase > RESTRICCIÓN
    // DE ROLE > punto 9 - "el login puede autenticarse... pero después de
    // recibir el usuario, role !== USER no debe entrar"). `user` refleja
    // la cuenta real tal cual, y es quien llama (LoginScreen) el que
    // decide qué hacer con el `role` del perfil devuelto.
    const tokens = await authService.loginUser(data);

    await saveSession(tokens.access_token, tokens.refresh_token, tokens.role);

    const profile = await authService.getProfile();
    setUser(profile);

    return profile;
  }, []);

  const register = useCallback(async (data: RegisterUserRequest) => {
    // No hay sesión que iniciar: el backend exige verificar el correo
    // antes de habilitar login (ver ErrorCode.EMAIL_NOT_VERIFIED). Se
    // devuelve la respuesta (mensaje + contadores expires_in /
    // resend_available_in) para que RegisterScreen arranque la pantalla
    // de verificación con los tiempos correctos.
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
        // Único role permitido en esta app (ver Fase > RESTRICCIÓN DE
        // ROLE). Se recalcula en cada render a partir del `user` real -
        // nunca se lee de SecureStore/token como autoridad final.
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
