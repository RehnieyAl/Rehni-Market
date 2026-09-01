import { useAuth } from "@/features/auth/hooks/useAuth";
import { RequireLoginScreen } from "@/components/RequireLoginScreen";
import { CartScreen } from "@/screens/cart/CartScreen";

export default function CartRoute() {
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

  return <CartScreen />;
}
