import { useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { Sheet } from "@/components/ui/Sheet";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { FormError } from "@/components/FormError";
import { formatPrice } from "@/utils/formatPrice";
import { buildRechargeWhatsappUrl } from "../utils/rechargeWhatsapp";
import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
}

const PRESET_AMOUNTS = [10000, 20000, 50000, 100000];

function validateAmount(raw: string): string | null {
  const value = raw.trim();
  if (!value) return "Ingresa la cantidad de RehniCoins que quieres solicitar.";
  if (!/^\d+$/.test(value)) return "Ingresa solo números, sin letras ni símbolos.";
  if (Number(value) <= 0) return "La cantidad debe ser mayor a cero.";
  return null;
}

export function RechargeSheet({ visible, onClose, userName, userEmail }: Props) {
  const [amount, setAmount] = useState("");

  const validationError = validateAmount(amount);

  const handleClose = () => {
    setAmount("");
    onClose();
  };

  const handleConfirm = async () => {
    if (validationError) return;

    const url = buildRechargeWhatsappUrl({
      amount: Number(amount.trim()),
      userName,
      userEmail,
    });

    if (!url) {
      Alert.alert(
        "Contacto no disponible",
        "No se pudo abrir WhatsApp: falta configurar el número de contacto de RehniMarket.",
      );
      return;
    }

    try {
      await Linking.openURL(url);
      handleClose();
    } catch {
      Alert.alert("No se pudo abrir WhatsApp", "Verifica que la app esté instalada.");
    }
  };

  return (
    <Sheet visible={visible} onClose={handleClose} title="Recargar RehniCoins">
      <Text style={styles.intro}>
        1 RehniCoin equivale a 1 COP. Te atenderemos por WhatsApp para confirmar el pago.
      </Text>

      <View style={styles.presets}>
        {PRESET_AMOUNTS.map((preset) => {
          const active = amount === String(preset);

          return (
            <Pressable
              key={preset}
              onPress={() => setAmount(String(preset))}
              style={[styles.preset, active && styles.presetActive]}
            >
              <Text style={[styles.presetText, active && styles.presetTextActive]}>
                {formatPrice(preset)} RC
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextField
        label="Otra cantidad"
        icon="cash-outline"
        keyboardType="number-pad"
        placeholder="Ej. 30000"
        value={amount}
        onChangeText={(value) => setAmount(value.replace(/[^0-9]/g, ""))}
      />

      {amount.trim() !== "" && <FormError message={validationError} />}

      <Button
        label="Solicitar por WhatsApp"
        onPress={handleConfirm}
        disabled={validationError !== null}
        style={styles.confirm}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  presets: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  preset: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  presetActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  presetText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  presetTextActive: {
    color: colors.primary,
  },
  confirm: {
    marginTop: spacing.xs,
  },
});
