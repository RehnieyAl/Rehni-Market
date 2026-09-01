import { useEffect } from "react";
import { Stack } from "expo-router";

import { AuthProvider } from "@/features/auth/context/AuthProvider";
import { CartProvider } from "@/features/cart/context/CartProvider";
import { FavoritesProvider } from "@/features/favorites/context/FavoritesProvider";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ROLE_REJECTED_MESSAGE } from "@/features/auth/constants";
import { setPendingSessionMessage } from "@/api/session";

export const unstable_settings = {
  initialRouteName: "(user)",
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <FavoritesProvider>
          <RootNavigation />
        </FavoritesProvider>
      </CartProvider>
    </AuthProvider>
  );
}

function RootNavigation() {
  const { isAuthenticated, isUser, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isUser) {
      setPendingSessionMessage(ROLE_REJECTED_MESSAGE);
      logout();
    }
  }, [isLoading, isAuthenticated, isUser, logout]);

  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="(user)">
      <Stack.Screen name="(user)" />
      <Stack.Screen name="(auth)" />
    </Stack>
  );
}
