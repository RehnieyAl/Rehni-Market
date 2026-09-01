import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/features/public/auth/context/useAuth";
import { setPostLoginRedirect } from "@/api/session";
import {
  resolveRoleHome,
  roleCanAccessArea,
  type AreaKey,
} from "@/features/public/auth/roleAccess";
import { Spinner } from "@/shared/components/ui";

interface Props {
  children: ReactNode;
  area?: AreaKey;
}

export default function RequireAuth({ children, area }: Props) {
  const { status, role } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner size={28} className="text-primary" />
      </div>
    );
  }

  if (status === "unauthenticated" || !role) {
    setPostLoginRedirect(location.pathname + location.search);

    return <Navigate to="/login" replace />;
  }

  if (area && !roleCanAccessArea(role, area)) {
    return <Navigate to={resolveRoleHome(role)} replace />;
  }

  return <>{children}</>;
}
