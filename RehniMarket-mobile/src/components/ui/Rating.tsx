import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, fontSize, fontWeight } from "@/theme";

interface Props {
  value: number | null;
  count: number;
  size?: "sm" | "md";
}

export function Rating({ value, count, size = "sm" }: Props) {
  if (value == null || count <= 0) return null;

  const starSize = size === "md" ? 15 : 13;
  const textStyle = size === "md" ? styles.textMd : styles.textSm;

  return (
    <View style={styles.row}>
      <Ionicons name="star" size={starSize} color={colors.warning} />
      <Text style={textStyle}>
        {value.toFixed(1)}{" "}
        <Text style={styles.count}>({count})</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  textSm: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  textMd: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  count: {
    fontWeight: fontWeight.regular,
    color: colors.textMuted,
  },
});
