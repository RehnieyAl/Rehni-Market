import { useEffect } from "react";
import { Stack } from "expo-router";

import { AuthProvider } from "@/features/auth/context/AuthProvider";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ROLE_REJECTED_MESSAGE } from "@/features/auth/constants";
import { setPendingSessionMessage } from "@/api/session";

// Ancla explícita del stack raíz (ver Fase Acceso Público > URGENTE - "al
// abrir sin sesión sigue apareciendo Login"): con dos grupos hermanos al
// mismo nivel ((auth) y (user)) y sin esto, expo-router puede no tener
// forma inequívoca de resolver cuál es la ruta "por defecto" del stack
// raíz en un arranque en frío (a diferencia de un grupo con un solo hijo,
// donde no hay ambigüedad). `unstable_settings.initialRouteName` es el
// mecanismo real y documentado de expo-router para esto (ver
// getRoutesCore.js > getLayoutNode/crawlAndAppendInitialRoutesAndEntryFiles,
// lee exactamente este export) - no es una redirección en tiempo de
// ejecución, es la declaración estática de qué grupo es la "home" del
// stack. `(user)` es el área pública (ver (user)/_layout.tsx) - la app
// SIEMPRE debe arrancar ahí, con o sin sesión.
export const unstable_settings = {
  initialRouteName: "(user)",
};

// Punto central de navegación por estado de auth (ver Fase 3 >
// PROTECCIÓN DE RUTAS): el AuthProvider vive acá arriba de todo, y cada
// grupo ((auth), (user)) decide en su propio _layout si te deja entrar o
// te redirige - ninguna pantalla individual navega por su cuenta según
// sesión.
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}

// Único lugar de la app donde se ejecuta el logout por role rechazado
// (ver Fase > RESTRICCIÓN DE ROLE > punto 4, "no repetir esta lógica
// individualmente en cada pantalla"). Cubre el caso que LoginScreen NO
// puede cubrir por sí solo: una sesión restaurada al abrir la app (o
// cualquier otro camino que deje `user` con un role no permitido) - ver
// punto 7, "usuario sin sesión" y "no autorizado" son estados distintos,
// ninguno de los dos debe dejar la navegación en un estado inconsistente.
function RootNavigation() {
  const { isAuthenticated, isUser, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isUser) {
      setPendingSessionMessage(ROLE_REJECTED_MESSAGE);
      logout();
    }
  }, [isLoading, isAuthenticated, isUser, logout]);

  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="(user)">
      <Stack.Screen name="(user)" />
      <Stack.Screen name="(auth)" />
    </Stack>
  );
}
