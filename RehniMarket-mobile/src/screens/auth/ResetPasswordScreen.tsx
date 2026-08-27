import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams, useRouter } from "expo-router";

import * as authService from "@/api/authService";
import { getApiErrorMessage } from "@/api/apiError";
import { CodeInput } from "@/features/auth/components/CodeInput";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { FormError } from "@/components/FormError";
import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";

// Portado de RehniMarket-frontend/src/features/public/auth/pages/
// ResetPassword.tsx: mismo endpoint (POST /auth/reset-password-user),
// misma validación de "las contraseñas coinciden" y "código completo"
// antes de llamar a la API.
export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();

  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (code.join("").length !== 6) {
      setError("Ingresa el código completo.");
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword({
        email: email ?? "",
        code: code.join(""),
        new_password: password,
      });

      router.replace({ pathname: "/(auth)/login", params: { email } });
    } catch (err) {
      setError(getApiErrorMessage(err, "Ocurrió un error inesperado."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark-outline" size={28} color={colors.primary} />
            </View>

            <Text style={styles.title}>Restablecer contraseña</Text>
            <Text style={styles.subtitle}>
              Ingresa el código recibido y crea una nueva contraseña.
            </Text>
            <Text style={styles.emailText}>{email}</Text>

            <View style={styles.form}>
              <FormError message={error} />

              <CodeInput value={code} onChange={setCode} />

              <TextField
                label="Nueva contraseña"
                icon="lock-closed-outline"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                toggleable
              />

              <TextField
                label="Confirmar contraseña"
                icon="lock-closed-outline"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                toggleable
              />

              <Button
                label={loading ? "Actualizando..." : "Guardar nueva contraseña"}
                onPress={handleSubmit}
                loading={loading}
              />
            </View>

            <Link href="/(auth)/login" style={styles.footerLink}>
              Volver al inicio de sesión
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  iconCircle: {
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },
  emailText: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    textAlign: "center",
  },
  form: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  footerLink: {
    marginTop: spacing.lg,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    textAlign: "center",
  },
});
