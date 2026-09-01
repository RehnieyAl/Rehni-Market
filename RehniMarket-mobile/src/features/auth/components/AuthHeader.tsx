import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { colors, spacing } from "@/theme";

interface Props {
  showBack?: boolean;
}

export function AuthHeader({ showBack = true }: Props) {
  const router = useRouter();

  if (!showBack || !router.canGoBack()) {
    return null;
  }

  return (
    <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
      <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: "flex-start",
    padding: spacing.xs,
  },
});
