import { useAuth } from "@/features/auth/hooks/useAuth";
import { RequireLoginScreen } from "@/components/RequireLoginScreen";
import { AddressesScreen } from "@/screens/addresses/AddressesScreen";

export default function AddressesRoute() {
  const { isUser } = useAuth();

  if (!isUser) {
    return (
      <RequireLoginScreen
        icon="location-outline"
        title="Tus direcciones"
        message="Inicia sesión para gestionar tus direcciones de envío."
      />
    );
  }

  return <AddressesScreen />;
}
