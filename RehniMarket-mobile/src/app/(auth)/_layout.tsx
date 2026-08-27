import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/features/auth/hooks/useAuth";

// Con sesión válida de comprador ya restaurada, nadie debería poder ver
// login/register "hacia atrás" - lo manda directo al área de usuario.
//
// Ojo con `isUser` acá (ver Fase > RESTRICCIÓN DE ROLE): una cuenta
// admin/owner/company/support autenticada NUNCA se redirige a
// `/(user)` desde acá - si lo hiciera, entraría a (user)/_layout.tsx
// solo para que el efecto raíz la rechace un instante después (logout +
// vuelta a login), un rebote visible e innecesario. Mientras esa sesión
// no permitida siga sin cerrarse, esta pantalla simplemente no la manda
// a ningún lado - se queda en el stack de auth.
export default function AuthLayout() {
  const { isAuthenticated, isUser, isLoading } = useAuth();

  if (isLoading) return null;

  if (isAuthenticated && isUser) {
    return <Redirect href="/(user)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
