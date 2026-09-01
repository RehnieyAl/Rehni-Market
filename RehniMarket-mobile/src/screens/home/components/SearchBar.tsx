import { Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { colors, fontSize, radii, spacing } from "@/theme";

export function SearchBar() {
  const router = useRouter();

  return (
    <Pressable style={styles.container} onPress={() => router.push("/(user)/search")}>
      <Ionicons name="search-outline" size={18} color={colors.textMuted} />
      <Text style={styles.placeholder}>Buscar productos...</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 44,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  placeholder: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
