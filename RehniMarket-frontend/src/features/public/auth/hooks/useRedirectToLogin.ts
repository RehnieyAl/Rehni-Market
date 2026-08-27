import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { setPostLoginRedirect } from "@/api/session";

// Hook centralizado para enviar a un usuario no autenticado a /login
// conservando la pantalla desde la que intentó una acción protegida
// (agregar al carrito, comprar, marcar favorito, etc. - ver AUDITORÍA de
// redirecciones de autenticación). Reutiliza el mismo mecanismo que ya
// usa el redirect automático por sesión expirada
// (api/session.ts > setPostLoginRedirect/consumePostLoginRedirect), así
// Login.tsx solo necesita un único lugar de dónde leer el destino sin
// importar si el visitante nunca inició sesión o si la sesión expiró a
// mitad de camino.
export function useRedirectToLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    setPostLoginRedirect(location.pathname + location.search);
    navigate("/login");
  }, [navigate, location]);
}
