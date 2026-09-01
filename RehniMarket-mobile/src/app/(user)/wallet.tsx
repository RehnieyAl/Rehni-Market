import { useAuth } from "@/features/auth/hooks/useAuth";
import { RequireLoginScreen } from "@/components/RequireLoginScreen";
import { WalletScreen } from "@/screens/wallet/WalletScreen";

export default function WalletRoute() {
  const { isUser } = useAuth();

  if (!isUser) {
    return (
      <RequireLoginScreen
        icon="wallet-outline"
        title="RehniCoins"
        message="Inicia sesión para ver tu saldo y tus movimientos."
      />
    );
  }

  return <WalletScreen />;
}
