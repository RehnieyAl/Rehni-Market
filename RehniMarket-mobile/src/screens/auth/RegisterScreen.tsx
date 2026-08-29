import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";

import { AuthHeader } from "@/features/auth/components/AuthHeader";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getApiErrorMessage } from "@/api/apiError";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { FormError } from "@/components/FormError";
import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";

// Portado de RehniMarket-frontend/src/features/public/auth/pages/
// RegisterUser.tsx: mismos 4 campos que espera POST /auth/register-user
// (full_name, email, password, tell - ver RegisterUserRequest). El
// checkbox de términos es solo un gate de UI, igual que en la web: el
// backend no recibe ningún campo de aceptación. El contenido completo de
// Términos y Condiciones (TermsModal/UserTerms en la web) no se porta en
// esta fase - no hay una pantalla de auth funcional que dependa de ese
// texto legal, queda para cuando se porte el contenido real.
export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [tell, setTell] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    fullName.trim() &&
    email.trim() &&
    tell.trim() &&
    password &&
    confirmPassword &&
    acceptedTerms;

  const handleSubmit = async () => {
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const res = await register({ full_name: fullName, email, password, tell });
      router.push({
        pathname: "/(auth)/verify-email",
        params: {
          email,
          expiresIn: res?.expires_in != null ? String(res.expires_in) : "",
          resendAvailableIn:
            res?.resend_available_in != null ? String(res.resend_available_in) : "",
        },
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo crear la cuenta."));
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
          <AuthHeader />

          <View style={styles.card}>
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>Completa tus datos para registrarte</Text>

            <View style={styles.form}>
              <FormError message={error} />

              <TextField
                label="Nombre completo"
                icon="person-outline"
                placeholder="Tu nombre"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />

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
                label="Teléfono"
                icon="call-outline"
                placeholder="Tu número de teléfono"
                value={tell}
                onChangeText={setTell}
                keyboardType="phone-pad"
              />

              <TextField
                label="Contraseña"
                icon="lock-closed-outline"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChangeText={setPassword}
                toggleable
              />

              <TextField
                label="Confirmar contraseña"
                icon="lock-closed-outline"
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                toggleable
              />

              <Pressable
                style={styles.termsRow}
                onPress={() => setAcceptedTerms((prev) => !prev)}
              >
                <Ionicons
                  name={acceptedTerms ? "checkbox" : "square-outline"}
                  size={20}
                  color={acceptedTerms ? colors.primary : colors.textMuted}
                />

                <Text style={styles.termsText}>
                  Acepto los Términos y Condiciones y la Política de Privacidad
                </Text>
              </Pressable>

              <Button
                label="Registrarme"
                onPress={handleSubmit}
                loading={loading}
                disabled={!canSubmit}
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
              <Link href="/(auth)/login" style={styles.footerLink}>
                Inicia sesión
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
    marginTop: spacing.sm,
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
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  termsText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
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
