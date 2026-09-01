import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { forgotPassword, updateMe } from "@/api/authService";
import { getApiErrorMessage } from "@/api/apiError";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { FormError } from "@/components/FormError";
import { colors, fontSize, fontWeight, radii, shadows, spacing } from "@/theme";

export function AccountScreen() {
  const router = useRouter();
  const { user, refreshSession, logout } = useAuth();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.tell ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendingCode, setSendingCode] = useState(false);

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "?";

  const startEditing = () => {
    setName(user?.name ?? "");
    setPhone(user?.tell ?? "");
    setEmail(user?.email ?? "");
    setError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length < 3) {
      setError("El nombre debe tener al menos 3 caracteres.");
      return;
    }
    if (!/^\d{10}$/.test(trimmedPhone)) {
      setError("El teléfono debe tener exactamente 10 dígitos.");
      return;
    }
    if (!trimmedEmail) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await updateMe({ fullName: trimmedName, tell: trimmedPhone, email: trimmedEmail });
      await refreshSession();
      setEditing(false);
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo actualizar tu información."));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    if (!user) return;

    const accountEmail = user.email;

    Alert.alert(
      "Cambiar contraseña",
      `Te enviaremos un código de verificación a ${accountEmail}. Cerraremos tu sesión para que crees la nueva contraseña; luego inicia sesión de nuevo.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          onPress: async () => {
            try {
              setSendingCode(true);
              await forgotPassword({ email: accountEmail });
              await logout();
              router.replace({
                pathname: "/(auth)/reset-password",
                params: { email: accountEmail },
              });
            } catch (err) {
              Alert.alert(
                "No se pudo enviar el código",
                getApiErrorMessage(err, "Intenta más tarde."),
              );
            } finally {
              setSendingCode(false);
            }
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer scroll maxWidth={560}>
      <Text style={styles.title}>Configuración de cuenta</Text>

      <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          {user?.profileImagen ? (
            <Image source={{ uri: user.profileImagen }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarInitial}>{initial}</Text>
          )}
        </View>
        <View style={styles.avatarInfo}>
          <Text style={styles.avatarName}>{user?.name}</Text>
          <Text style={styles.avatarEmail}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Información personal</Text>
          {!editing && (
            <Button label="Editar" variant="outline" onPress={startEditing} style={styles.editButton} />
          )}
        </View>

        {editing ? (
          <View style={styles.form}>
            <FormError message={error} />

            <TextField
              label="Nombre"
              icon="person-outline"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <TextField
              label="Teléfono"
              icon="call-outline"
              keyboardType="number-pad"
              maxLength={10}
              value={phone}
              onChangeText={(value) => setPhone(value.replace(/[^0-9]/g, ""))}
            />
            <TextField
              label="Correo electrónico"
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />

            <View style={styles.formActions}>
              <Button
                label="Cancelar"
                variant="outline"
                onPress={() => setEditing(false)}
                style={styles.formAction}
              />
              <Button
                label={saving ? "Guardando..." : "Guardar"}
                onPress={handleSave}
                loading={saving}
                style={styles.formAction}
              />
            </View>
          </View>
        ) : (
          <View style={styles.readRows}>
            <ReadRow label="Nombre" value={user?.name ?? "—"} />
            <ReadRow label="Teléfono" value={user?.tell ?? "—"} />
            <ReadRow label="Correo electrónico" value={user?.email ?? "—"} />
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Seguridad</Text>
        <Text style={styles.cardHint}>
          Cambia tu contraseña verificando tu correo electrónico.
        </Text>
        <Button
          label={sendingCode ? "Enviando código..." : "Cambiar contraseña"}
          variant="outline"
          onPress={handleChangePassword}
          loading={sendingCode}
        />
      </View>

      <Button label="Cerrar sesión" variant="outline" onPress={logout} style={styles.logout} />
    </ScreenContainer>
  );
}

function ReadRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.readRow}>
      <Text style={styles.readLabel}>{label}</Text>
      <Text style={styles.readValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  avatarInfo: {
    flex: 1,
    gap: 2,
  },
  avatarName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  avatarEmail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  cardHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  editButton: {
    paddingHorizontal: spacing.md,
  },
  form: {
    gap: spacing.md,
  },
  formActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  formAction: {
    flex: 1,
  },
  readRows: {
    gap: spacing.md,
  },
  readRow: {
    gap: 2,
  },
  readLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  readValue: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  logout: {
    marginBottom: spacing.xxl,
  },
});
