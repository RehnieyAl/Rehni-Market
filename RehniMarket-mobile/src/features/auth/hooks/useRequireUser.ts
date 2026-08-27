import { useCallback } from "react";
import { useRouter } from "expo-router";

import { setPendingAction } from "@/api/session";
import type { PendingAction } from "@/api/session";

import { useAuth } from "./useAuth";

// Abstracción CENTRAL para cualquier acción que requiera cuenta (ver Fase
// Acceso Público > PROTECCIÓN DE ACCIONES): agregar al carrito, marcar
// favorito, comprar, etc. pasan todas por acá en vez de repetir
// `if (!isUser) { ...redirigir... }` en cada pantalla/componente.
//
// `isUser` ya implica `isAuthenticated` (ver AuthContext.tsx > isUser =
// user?.role === "user" - si `user` es null, esto es false) - una cuenta
// autenticada con role no permitido (admin/owner/company/support) también
// cae acá como "no puede", sin necesitar un caso aparte: el efecto raíz
// (app/_layout.tsx > RootNavigation) ya la desloguea casi de inmediato,
// así que en la práctica llega a este hook como visitante.
//
// Devuelve `true` si la acción puede continuar de una (ya hay un USER
// autenticado). Devuelve `false` y manda a Login si no - guardando
// `pendingAction` para retomar la intención exacta después de loguearse
// (ver session.ts > PendingAction, LoginScreen.tsx).
export function useRequireUser() {
  const router = useRouter();
  const { isUser } = useAuth();

  return useCallback(
    (pendingAction?: PendingAction) => {
      if (isUser) return true;

      if (pendingAction) {
        setPendingAction(pendingAction);
      }

      router.push("/(auth)/login");
      return false;
    },
    [isUser, router],
  );
}
