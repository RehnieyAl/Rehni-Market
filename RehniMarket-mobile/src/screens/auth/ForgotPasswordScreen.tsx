import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";

import * as authService from "@/api/authService";
import { getApiErrorDetail } from "@/api/apiError";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { FormError } from "@/components/FormError";
import { ErrorCode } from "@/types/ErrorCode";
import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      await authService.forgotPassword({ email });
      router.push({ pathname: "/(auth)/reset-password", params: { email } });
    } catch (err) {
      const detail = getApiErrorDetail(err);

      if (detail?.code === ErrorCode.EMAIL_NOT_VERIFIED) {
        router.push({ pathname: "/(auth)/verify-email", params: { email } });
        return;
      }

      setError(detail?.message ?? "No fue posible enviar el código de recuperación.");
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
              <Ionicons name="mail-outline" size={28} color={colors.primary} />
            </View>

            <Text style={styles.title}>Recuperar contraseña</Text>
            <Text style={styles.subtitle}>
              Ingresa el correo asociado a tu cuenta y te enviaremos un código para
              restablecer tu contraseña.
            </Text>

            <View style={styles.form}>
              <FormError message={error} />

              <TextField
                label="Correo electrónico"
                icon="mail-outline"
                placeholder="ejemplo@correo.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />

              <Button
                label={loading ? "Enviando..." : "Enviar código"}
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
    marginBottom: spacing.lg,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  form: {
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
