import { Stack } from "expo-router";

import { useAuth } from "@/features/auth/hooks/useAuth";

// Área PÚBLICA del marketplace (ver Fase Acceso Público > REGLA
// PRINCIPAL): Home/Categorías/Producto/Búsqueda no requieren sesión. El
// nombre del grupo `(user)` es histórico (no afecta rutas, expo-router
// ignora los paréntesis) - lo que importa es este guard, no el nombre de
// la carpeta.
//
// Antes esto redirigía a `/(auth)/login` para cualquier visitante sin
// sesión (`!isAuthenticated`), lo que bloqueaba TODA la app detrás de un
// login obligatorio. Ya no: un visitante entra igual que un USER
// autenticado, y cada acción que de verdad requiere cuenta (agregar al
// carrito, favoritos, checkout...) se protege puntualmente con
// useRequireUser() en el punto donde ocurre (ver
// features/auth/hooks/useRequireUser.ts) - NO acá, a nivel de stack
// entero, que es lo que impedía la navegación pública.
//
// Lo único que este guard sigue bloqueando: una sesión autenticada con
// role !== "user" (admin/owner/company/support - ver Fase > ROLES NO
// PERMITIDOS). Esa combinación es transitoria en la práctica (el efecto
// raíz en app/_layout.tsx > RootNavigation la desloguea casi de
// inmediato), pero mientras dure ese instante, tampoco debe ver esta
// área - ni como "comprador" (no lo es) ni colándose un frame de Home con
// una sesión que va a cerrarse.
export default function UserLayout() {
  const { isAuthenticated, isUser, isLoading } = useAuth();

  if (isLoading) return null;

  if (isAuthenticated && !isUser) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
