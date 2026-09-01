import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { colors, fontSize, fontWeight, spacing } from "@/theme";

interface Props {
  title: string;
  onBack?: () => void;
  showBack?: boolean;
  right?: ReactNode;
}

export function ScreenHeader({ title, onBack, showBack = true, right }: Props) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.side}>
        {showBack && (
          <Pressable
            onPress={onBack ?? (() => router.back())}
            hitSlop={8}
            accessibilityLabel="Volver"
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
        )}
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  side: {
    minWidth: 40,
    flexDirection: "row",
    alignItems: "center",
  },
  sideRight: {
    justifyContent: "flex-end",
  },
  title: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
});
