import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { setPostLoginRedirect } from "@/api/session";

// Envía a /login conservando la pantalla desde la que se intentó una acción protegida.
// Reutiliza el mismo mecanismo (api/session.ts) que el redirect por sesión expirada.
export function useRedirectToLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    setPostLoginRedirect(location.pathname + location.search);
    navigate("/login");
  }, [navigate, location]);
}
