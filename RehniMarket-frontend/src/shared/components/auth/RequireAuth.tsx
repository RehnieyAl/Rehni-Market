import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/features/public/auth/context/useAuth";
import { setPostLoginRedirect } from "@/api/session";

interface Props {
  children: ReactNode;
}

// Guarda de ruta para pantallas que requieren sesión iniciada (dashboards
// de empresa/admin/usuario y checkout - ver AUDITORÍA de redirecciones de
// autenticación, CASO 4: acceso directo a una ruta protegida). Antes de
// este componente, esas rutas no verificaban nada del lado del cliente y
// dependían de que alguna llamada a la API fallara con 401 para recién
// ahí mandar al login (perdiendo la ruta de origen, ver
// setupAuthInterceptor.ts > redirectToLogin).
//
// Solo verifica que EXISTA sesión (accessToken), nunca el rol: un
// usuario autenticado con el rol equivocado debe poder entrar igual y
// recibir el manejo de autorización que ya existe hoy (403 del backend +
// alerta global, ver apiErrorHandler.ts) - "no autenticado" y
// "autenticado sin permisos" son casos distintos y este componente no
// debe mezclarlos.
export default function RequireAuth({ children }: Props) {
  const { accessToken } = useAuth();
  const location = useLocation();

  if (!accessToken) {
    setPostLoginRedirect(location.pathname + location.search);

    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
