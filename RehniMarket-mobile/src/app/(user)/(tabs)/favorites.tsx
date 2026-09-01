import { useAuth } from "@/features/auth/hooks/useAuth";
import { RequireLoginScreen } from "@/components/RequireLoginScreen";
import { FavoritesScreen } from "@/screens/favorites/FavoritesScreen";

export default function FavoritesRoute() {
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

  return <FavoritesScreen />;
}
