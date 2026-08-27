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

// Portado de RehniMarket-frontend/src/features/public/auth/pages/
// Login.tsx: mismo endpoint (vía useAuth().login → POST /auth/login-user),
// mismo caso especial EMAIL_NOT_VERIFIED (redirige a verify-email con el
// correo precargado en vez de mostrar el error genérico). El resto de
// errores (credenciales inválidas, cuenta bloqueada ya resuelta por el
// interceptor, etc.) se muestra en el banner de arriba - la web los deja
// al toast global, acá no existe todavía (ver FormError.tsx).
//
// Esta app es exclusiva para comprador (ver Fase > RESTRICCIÓN DE ROLE):
// el backend puede autenticar credenciales válidas de cualquier role, así
// que después de obtener el perfil real se comprueba `role === "user"`
// acá mismo, ANTES de navegar a (user) - evita el parpadeo de entrar y
// que el guard central (app/_layout.tsx) recién ahí cierre la sesión.
export default function LoginScreen() {
  const router = useRouter();
  const { email: prefilledEmail } = useLocalSearchParams<{ email?: string }>();
  const { login, logout } = useAuth();

  const [email, setEmail] = useState(prefilledEmail ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // Mensaje dejado por otra pantalla antes de forzar un logout (sesión
  // expirada, cuenta bloqueada, o role no permitido restaurado al abrir
  // la app - ver api/session.ts > setPendingSessionMessage/
  // consumePendingSessionMessage y app/_layout.tsx). Se consume una sola
  // vez al montar, igual que auth_alert en la web.
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

      // Retomar la intención que dejó pendiente un visitante (ver Fase
      // Acceso Público > PENDING ACTION): se lee sin consumir (peek) -
      // quien realmente aplica la variante/cantidad guardadas es la
      // pantalla de destino (ver ProductDetailScreen.tsx > efecto de
      // resume), esta pantalla solo decide A DÓNDE volver. Cualquier otro
      // tipo (ADD_TO_FAVORITES/CHECKOUT, todavía sin pantalla que los
      // retome) cae al comportamiento normal.
      const pending = peekPendingAction();

      if (pending?.type === "ADD_TO_CART") {
        router.replace({ pathname: "/(user)/product/[id]", params: { id: pending.productId } });
        return;
      }

      router.replace("/(user)");
    } catch (err) {
      const detail = getApiErrorDetail(err);

      if (detail?.code === ErrorCode.EMAIL_NOT_VERIFIED) {
        router.push({ pathname: "/(auth)/verify-email", params: { email } });
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
