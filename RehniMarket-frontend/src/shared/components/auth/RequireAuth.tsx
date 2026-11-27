/** Guardia de rutas privadas: exige sesión y el área del rol; sin sesión lleva al login (o, tras un
 * cierre de sesión del usuario, a la última página pública). */
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/features/public/auth/context/useAuth";
import { setPostLoginRedirect } from "@/api/session";
import {
  resolveRoleHome,
  roleCanAccessArea,
  type AreaKey,
} from "@/features/public/auth/roleAccess";
import { lastPublicPath } from "@/features/public/auth/authNavigation";
import { Spinner } from "@/shared/components/ui";

interface Props {
  children: ReactNode;
  area?: AreaKey;
}

export default function RequireAuth({ children, area }: Props) {
  const { status, role, signedOutByUser } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner size={28} className="text-secondary" />
      </div>
    );
  }

  if (status === "unauthenticated" || !role) {
    // Quien cerró sesión a propósito no quiere volver a entrar: vuelve a la última página pública.
    if (signedOutByUser) return <Navigate to={lastPublicPath()} replace />;

    setPostLoginRedirect(location.pathname + location.search);

    return <Navigate to="/login" replace />;
  }

  if (area && !roleCanAccessArea(role, area)) {
    return <Navigate to={resolveRoleHome(role)} replace />;
  }

  return <>{children}</>;
}
