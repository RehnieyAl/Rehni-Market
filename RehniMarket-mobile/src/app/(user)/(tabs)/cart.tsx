import { useAuth } from "@/features/auth/hooks/useAuth";
import { RequireLoginScreen } from "@/components/RequireLoginScreen";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";

// (user) ya es público (ver Fase Acceso Público > (user)/_layout.tsx) -
// este tab puede recibir visitantes, así que resuelve su propio gate acá
// en vez de asumir sesión. `isUser` ya implica autenticado (ver
// AuthContext.tsx), no hace falta comprobar `isAuthenticated` aparte.
export default function CartScreen() {
  const { isUser } = useAuth();

  if (!isUser) {
    return (
      <RequireLoginScreen
        icon="cart-outline"
        title="Tu carrito"
        message="Para ver tu carrito, inicia sesión."
      />
    );
  }

  // PLACEHOLDER - carrito real (GET /cart + CartProvider) llega en su
  // propia fase.
  return (
    <PlaceholderScreen
      icon="cart-outline"
      title="Carrito"
      description="Tu carrito va a aparecer acá cuando agregues productos."
    />
  );
}
