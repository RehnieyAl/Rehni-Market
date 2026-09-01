import { useCallback } from "react";
import { useRouter } from "expo-router";

import { setPendingAction } from "@/api/session";
import type { PendingAction } from "@/api/session";

import { useAuth } from "./useAuth";

export function useRequireUser() {
  const router = useRouter();
  const { isUser } = useAuth();

  return useCallback(
    (pendingAction?: PendingAction) => {
      if (isUser) return true;

      if (pendingAction) {
        setPendingAction(pendingAction);
      }

      router.push("/(auth)/login");
      return false;
    },
    [isUser, router],
  );
}
