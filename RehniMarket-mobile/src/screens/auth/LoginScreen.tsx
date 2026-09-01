import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useLocalSearchParams, useRouter } from "expo-router";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { ROLE_REJECTED_MESSAGE } from "@/features/auth/constants";
import { getApiErrorDetail } from "@/api/apiError";
import { consumePendingSessionMessage, peekPendingAction } from "@/api/session";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { FormError } from "@/components/FormError";
import { ErrorCode } from "@/types/ErrorCode";
import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";

export default function LoginScreen() {
  const router = useRouter();
  const { email: prefilledEmail } = useLocalSearchParams<{ email?: string }>();
  const { login, logout } = useAuth();

  const [email, setEmail] = useState(prefilledEmail ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => consumePendingSessionMessage());

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      const profile = await login({ email, password });

      if (profile.role !== "user") {
        await logout();
        setError(ROLE_REJECTED_MESSAGE);
        return;
      }

      const pending = peekPendingAction();

      if (pending?.type === "ADD_TO_CART") {
        router.replace({ pathname: "/(user)/product/[id]", params: { id: pending.productId } });
        return;
      }

      router.replace("/(user)");
    } catch (err) {
      const detail = getApiErrorDetail(err);

      if (detail?.code === ErrorCode.EMAIL_NOT_VERIFIED) {
        router.push({
          pathname: "/(auth)/verify-email",
          params: {
            email,
            expiresIn: detail.expires_in != null ? String(detail.expires_in) : "",
            resendAvailableIn:
              detail.resend_available_in != null ? String(detail.resend_available_in) : "",
          },
        });
        return;
      }

      setError(detail?.message ?? "No se pudo iniciar sesión.");
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
            <Text style={styles.title}>Iniciar sesión</Text>
            <Text style={styles.subtitle}>Ingresa tus datos para continuar</Text>

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

              <TextField
                label="Contraseña"
                icon="lock-closed-outline"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                toggleable
              />

              <Link href="/(auth)/forgot-password" style={styles.forgotLink}>
                ¿Olvidaste tu contraseña?
              </Link>

              <Button label="Ingresar" onPress={handleSubmit} loading={loading} />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿No tienes cuenta? </Text>
              <Link href="/(auth)/register" style={styles.footerLink}>
                Regístrate
              </Link>
            </View>
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
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },
  form: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  forgotLink: {
    alignSelf: "flex-end",
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  footer: {
    marginTop: spacing.lg,
    flexDirection: "row",
    justifyContent: "center",
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
});
