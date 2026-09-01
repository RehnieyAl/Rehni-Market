import { Stack } from "expo-router";

import { useAuth } from "@/features/auth/hooks/useAuth";

export default function UserLayout() {
  const { isAuthenticated, isUser, isLoading } = useAuth();

  if (isLoading) return null;

  if (isAuthenticated && !isUser) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
