import { useAuth } from "@/features/auth/hooks/useAuth";
import { RequireLoginScreen } from "@/components/RequireLoginScreen";
import { ProfileScreen } from "@/screens/profile/ProfileScreen";

export default function ProfileRoute() {
  const { isUser } = useAuth();

  if (!isUser) {
    return (
      <RequireLoginScreen
        icon="person-outline"
        title="Tu cuenta"
        message="Inicia sesión para acceder a tu cuenta."
      />
    );
  }

  return <ProfileScreen />;
}
