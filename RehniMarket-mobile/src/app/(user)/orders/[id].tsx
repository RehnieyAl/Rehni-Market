import { useLocalSearchParams } from "expo-router";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { RequireLoginScreen } from "@/components/RequireLoginScreen";
import { OrderDetailScreen } from "@/screens/orders/OrderDetailScreen";

export default function OrderDetailRoute() {
  const { isUser } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!isUser) {
    return (
      <RequireLoginScreen
        icon="bag-handle-outline"
        title="Tus pedidos"
        message="Inicia sesión para ver el detalle de tus pedidos."
      />
    );
  }

  return <OrderDetailScreen orderId={id} />;
}
