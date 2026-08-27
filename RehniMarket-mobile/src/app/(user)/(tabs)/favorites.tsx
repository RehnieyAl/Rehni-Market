import { useAuth } from "@/features/auth/hooks/useAuth";
import { RequireLoginScreen } from "@/components/RequireLoginScreen";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";

// Mismo criterio que cart.tsx (ver Fase Acceso Público > FAVORITOS): el
// tab es accesible para visitantes, pero su contenido requiere cuenta.
export default function FavoritesScreen() {
  const { isUser } = useAuth();

  if (!isUser) {
    return (
      <RequireLoginScreen
        icon="heart-outline"
        title="Tus favoritos"
        message="Inicia sesión para guardar y ver tus productos favoritos."
      />
    );
  }

  // PLACEHOLDER - listado real de favoritos (GET /favorites) llega en su
  // propia fase.
  return (
    <PlaceholderScreen
      icon="heart-outline"
      title="Favoritos"
      description="Acá vas a ver los productos que guardes para más tarde."
    />
  );
}
