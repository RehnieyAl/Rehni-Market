import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/features/public/auth/context/useAuth";
import { setPostLoginRedirect } from "@/api/session";

interface Props {
  children: ReactNode;
}

// Guarda de ruta para pantallas que requieren sesión. Solo verifica que exista accessToken,
// nunca el rol: la autorización (403 + alerta) la maneja el backend.
export default function RequireAuth({ children }: Props) {
  const { accessToken } = useAuth();
  const location = useLocation();

  if (!accessToken) {
    setPostLoginRedirect(location.pathname + location.search);

    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
