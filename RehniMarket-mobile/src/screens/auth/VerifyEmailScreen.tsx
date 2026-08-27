import { useState } from "react";
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

// Portado de RehniMarket-frontend/src/features/public/auth/pages/
// VerifyEmail.tsx: mismos dos endpoints (POST /auth/verify-email-user y
// POST /auth/change-email), mismo flujo de "¿el correo es incorrecto?".
export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email: paramEmail } = useLocalSearchParams<{ email?: string }>();

  const [currentEmail, setCurrentEmail] = useState(paramEmail ?? "");
  const [newEmail, setNewEmail] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);

  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);

  const [loading, setLoading] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = async () => {
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

      if (detail?.code === ErrorCode.USER_NOT_FOUND) {
        setError(detail.message ?? "Usuario no encontrado.");
      } else {
        setError(detail?.message ?? "Ocurrió un error.");
      }
    } finally {
      setLoading(false);
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
      await authService.changeEmail({ old_email: currentEmail, new_email: newEmail });

      setCurrentEmail(newEmail);
      setNewEmail("");
      setEditingEmail(false);
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

              <CodeInput value={code} onChange={setCode} />

              <Button
                label={loading ? "Verificando..." : "Verificar correo"}
                onPress={handleSubmit}
                loading={loading}
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
  footer: {
    marginTop: spacing.xl,
    alignItems: "center",
    gap: spacing.xs,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
});
