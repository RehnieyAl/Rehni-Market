/** Cierre de sesión que no saca al usuario de la página: en una ruta pública se queda en ella (con su
 * búsqueda y hash) como visitante; en una privada vuelve a la última página pública conocida. */
import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/useAuth";
import { lastPublicPath } from "../authNavigation";
import { isProtectedPath } from "../roleAccess";

export function useSignOut() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    logout({ byUser: true });
    if (isProtectedPath(location.pathname)) {
      void navigate(lastPublicPath(), { replace: true });
    }
  }, [logout, navigate, location.pathname]);
}
