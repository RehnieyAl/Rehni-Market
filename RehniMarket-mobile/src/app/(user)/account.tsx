import { useAuth } from "@/features/auth/hooks/useAuth";
import { RequireLoginScreen } from "@/components/RequireLoginScreen";
import { AccountScreen } from "@/screens/account/AccountScreen";

export default function AccountRoute() {
  const { isUser } = useAuth();

  if (!isUser) {
    return (
      <RequireLoginScreen
        icon="person-outline"
        title="Tu cuenta"
        message="Inicia sesión para gestionar tu información."
      />
    );
  }

  return <AccountScreen />;
}
