import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { Button } from "@/components/Button";
import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
}

export function RequireLoginScreen({ icon, title, message }: Props) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      <Button
        label="Iniciar sesión"
        onPress={() => router.push("/(auth)/login")}
        style={styles.button}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: "center",
  },
  message: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },
  button: {
    marginTop: spacing.xl,
    width: "60%",
  },
});
