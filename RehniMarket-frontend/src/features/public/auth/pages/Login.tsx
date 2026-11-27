/** Página /login para el acceso directo y las rutas protegidas: el mismo formulario del modal. Tras
 * iniciar sesión va al destino protegido pedido (si el rol lo permite) o a la última página pública. */
import { LogIn } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { consumePostLoginRedirect } from "@/api/session";
import AuthLayout from "@/features/public/auth/components/AuthLayout";
import LoginForm from "@/features/public/auth/components/LoginForm";
import { isSafeInternalPath, lastPublicPath } from "@/features/public/auth/authNavigation";
import { isPathAllowedForRole } from "@/features/public/auth/roleAccess";
import type { Role } from "@/features/public/auth/types/auth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSuccess = (role: Role) => {
    const requested = consumePostLoginRedirect();
    const target =
      isSafeInternalPath(requested) && isPathAllowedForRole(requested, role) ? requested : lastPublicPath();
    void navigate(target, { replace: true });
  };

  return (
    <AuthLayout
      icon={<LogIn size={26} />}
      title="Iniciar sesión"
      subtitle="Ingresa con tu cuenta de RehniMarket."
      backFallback={lastPublicPath()}
    >
      <LoginForm initialEmail={location.state?.email ?? ""} onSuccess={handleSuccess} />
    </AuthLayout>
  );
}
