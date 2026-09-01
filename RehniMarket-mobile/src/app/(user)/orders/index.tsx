import { useAuth } from "@/features/auth/hooks/useAuth";
import { RequireLoginScreen } from "@/components/RequireLoginScreen";
import { OrdersScreen } from "@/screens/orders/OrdersScreen";

export default function OrdersRoute() {
  const { isUser } = useAuth();

  if (!isUser) {
    return (
      <RequireLoginScreen
        icon="bag-handle-outline"
        title="Tus pedidos"
        message="Inicia sesión para ver el historial de tus pedidos."
      />
    );
  }

  return <OrdersScreen />;
}
