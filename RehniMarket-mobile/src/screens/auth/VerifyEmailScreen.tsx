import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams, useRouter } from "expo-router";

import * as authService from "@/api/authService";
import { getApiErrorDetail, getApiErrorMessage } from "@/api/apiError";
import { CodeInput } from "@/features/auth/components/CodeInput";
import { Button } from "@/components/Button";
import { FormError } from "@/components/FormError";
import { ErrorCode } from "@/types/ErrorCode";
import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";

// mm:ss a partir de segundos (>= 0).
function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

// param string ("300") -> timestamp absoluto (ms) o null.
function toDeadline(seconds: string | number | undefined | null): number | null {
  const n = typeof seconds === "string" ? Number(seconds) : seconds;
  return typeof n === "number" && Number.isFinite(n) && n >= 0
    ? Date.now() + n * 1000
    : null;
}

// Portado de RehniMarket-frontend/src/features/public/auth/pages/
// VerifyEmail.tsx: mismos endpoints (POST /auth/verify-email-user,
// /auth/change-email y /auth/resend-verification-code), dos contadores
// independientes (expiracion del codigo 5 min / cooldown de reenvio 60 s)
// y el mismo flujo de "el correo es incorrecto". La expiracion real la
// valida el backend - el contador de aca es solo informativo.
export default function VerifyEmailScreen() {
  const router = useRouter();
  const {
    email: paramEmail,
    expiresIn,
    resendAvailableIn,
  } = useLocalSearchParams<{
    email?: string;
    expiresIn?: string;
    resendAvailableIn?: string;
  }>();

  const [currentEmail, setCurrentEmail] = useState(paramEmail ?? "");
  const [newEmail, setNewEmail] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);

  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);

  const [loading, setLoading] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // CONTADOR 1: expiracion del codigo (null = estado desconocido).
  const [codeDeadline, setCodeDeadline] = useState<number | null>(() =>
    toDeadline(expiresIn),
  );
  // CONTADOR 2: cooldown de reenvio (siempre hay uno).
  const [resendDeadline, setResendDeadline] = useState<number>(
    () => toDeadline(resendAvailableIn) ?? Date.now(),
  );
  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const codeSecondsLeft =
    codeDeadline === null
      ? null
      : Math.max(0, Math.ceil((codeDeadline - nowTs) / 1000));
  const resendSecondsLeft = Math.max(0, Math.ceil((resendDeadline - nowTs) / 1000));

  const codeExpired = codeSecondsLeft === 0;
  const canResend = resendSecondsLeft === 0 && !resending && !changingEmail;

  const applyCodeState = (state: {
    expires_in?: number;
    resend_available_in?: number;
  }) => {
    setCodeDeadline(toDeadline(state.expires_in));
    setResendDeadline(toDeadline(state.resend_available_in) ?? Date.now());
  };

  const handleSubmit = async () => {
    if (codeExpired) {
      setError("El código expiró. Solicita uno nuevo para continuar.");
      return;
    }

    const verificationCode = code.join("");

    if (verificationCode.length !== 6) {
      setError("Ingresa el código completo.");
      return;
    }

    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      await authService.verifyEmail({ email: currentEmail, code: verificationCode });
      router.replace({ pathname: "/(auth)/login", params: { email: currentEmail } });
    } catch (err) {
      const detail = getApiErrorDetail(err);

      if (detail?.code === ErrorCode.CODE_EXPIRED) {
        setCodeDeadline(Date.now());
      }

      if (detail?.code === ErrorCode.USER_NOT_FOUND) {
        setError(detail.message ?? "Usuario no encontrado.");
      } else {
        setError(detail?.message ?? "Ocurrió un error.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setError(null);
    setNotice(null);
    setResending(true);

    try {
      const res = await authService.resendVerificationCode({ email: currentEmail });

      applyCodeState(res);
      setCode(["", "", "", "", "", ""]);
      setNotice(res.message ?? "Se ha enviado un nuevo código a tu correo.");
    } catch (err) {
      const detail = getApiErrorDetail(err);

      if (
        detail?.code === ErrorCode.RESEND_COOLDOWN_ACTIVE &&
        typeof detail.retry_after === "number"
      ) {
        setResendDeadline(Date.now() + detail.retry_after * 1000);
      }

      setError(detail?.message ?? "No fue posible reenviar el código.");
    } finally {
      setResending(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) {
      setError("Ingresa un correo electrónico.");
      return;
    }

    setError(null);
    setChangingEmail(true);

    try {
      const res = await authService.changeEmail({
        old_email: currentEmail,
        new_email: newEmail,
      });

      setCurrentEmail(newEmail);
      setNewEmail("");
      setEditingEmail(false);
      setCode(["", "", "", "", "", ""]);
      applyCodeState(res ?? {});
      setNotice("Correo actualizado. Se envió un nuevo código de verificación.");
    } catch (err) {
      setError(getApiErrorMessage(err, "No fue posible cambiar el correo."));
    } finally {
      setChangingEmail(false);
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

            <Text style={styles.title}>Verificar correo</Text>
            <Text style={styles.subtitle}>Hemos enviado un código de verificación a</Text>
            <Text style={styles.emailText}>{currentEmail}</Text>

            {!editingEmail ? (
              <Pressable onPress={() => setEditingEmail(true)} style={styles.changeEmailButton}>
                <Text style={styles.changeEmailText}>
                  ¿El correo es incorrecto? Cambiar correo
                </Text>
              </Pressable>
            ) : (
              <View style={styles.changeEmailForm}>
                <TextInput
                  value={newEmail}
                  onChangeText={setNewEmail}
                  placeholder="Nuevo correo electrónico"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.changeEmailInput}
                />

                <View style={styles.changeEmailActions}>
                  <Button
                    label={changingEmail ? "Actualizando..." : "Guardar"}
                    onPress={handleChangeEmail}
                    loading={changingEmail}
                    style={styles.flexButton}
                  />

                  <Button
                    label="Cancelar"
                    variant="outline"
                    onPress={() => {
                      setEditingEmail(false);
                      setNewEmail("");
                    }}
                    style={styles.flexButton}
                  />
                </View>
              </View>
            )}

            <View style={styles.form}>
              <FormError message={error} />
              {notice && <Text style={styles.notice}>{notice}</Text>}

              <CodeInput value={code} onChange={setCode} disabled={codeExpired} />

              {/* CONTADOR 1 - expiracion del codigo */}
              {codeSecondsLeft !== null && !codeExpired && (
                <Text style={styles.countdown}>
                  Código válido durante{" "}
                  <Text style={styles.countdownValue}>
                    {formatCountdown(codeSecondsLeft)}
                  </Text>
                </Text>
              )}

              {codeExpired && (
                <View style={styles.expiredBox}>
                  <Text style={styles.expiredTitle}>Código expirado.</Text>
                  <Text style={styles.expiredText}>
                    Solicita un nuevo código para continuar.
                  </Text>
                </View>
              )}

              <Button
                label={loading ? "Verificando..." : "Verificar correo"}
                onPress={handleSubmit}
                loading={loading}
                disabled={codeExpired}
              />
            </View>

            {/* CONTADOR 2 - cooldown de reenvio (separado del contador 1) */}
            <View style={styles.resendSection}>
              <Text style={styles.footerText}>¿No recibiste el código?</Text>

              {!canResend && resendSecondsLeft > 0 && (
                <Text style={styles.countdown}>
                  Puedes reenviar en{" "}
                  <Text style={styles.countdownValue}>
                    {formatCountdown(resendSecondsLeft)}
                  </Text>
                </Text>
              )}

              <Button
                label={resending ? "Enviando..." : "Reenviar código"}
                variant="outline"
                onPress={handleResend}
                loading={resending}
                disabled={!canResend}
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿Ya verificaste tu cuenta?</Text>

              <Link
                href={{ pathname: "/(auth)/login", params: { email: currentEmail } }}
                style={styles.footerLink}
              >
                Ir al inicio de sesión
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
  changeEmailButton: {
    marginTop: spacing.md,
    alignItems: "center",
  },
  changeEmailText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  changeEmailForm: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  changeEmailInput: {
    height: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.base,
    color: colors.textPrimary,
  },
  changeEmailActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
  form: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  notice: {
    fontSize: fontSize.sm,
    color: colors.success,
  },
  countdown: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },
  countdownValue: {
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  expiredBox: {
    borderWidth: 1,
    borderColor: colors.dangerMuted,
    backgroundColor: colors.dangerMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: "center",
  },
  expiredTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.danger,
  },
  expiredText: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.danger,
    textAlign: "center",
  },
  resendSection: {
    marginTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
    gap: spacing.sm,
    alignItems: "stretch",
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: "center",
    gap: spacing.xs,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },
  footerLink: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
});
