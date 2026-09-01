import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/features/auth/hooks/useAuth";

export default function AuthLayout() {
  const { isAuthenticated, isUser, isLoading } = useAuth();

  if (isLoading) return null;

  if (isAuthenticated && isUser) {
    return <Redirect href="/(user)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
