import { useAuth } from "@/features/auth/hooks/useAuth";
import { RequireLoginScreen } from "@/components/RequireLoginScreen";
import { CheckoutScreen } from "@/screens/checkout/CheckoutScreen";

export default function CheckoutRoute() {
  const { isUser } = useAuth();

  if (!isUser) {
    return (
      <RequireLoginScreen
        icon="card-outline"
        title="Finalizar compra"
        message="Inicia sesión para completar tu compra."
      />
    );
  }

  return <CheckoutScreen />;
}
