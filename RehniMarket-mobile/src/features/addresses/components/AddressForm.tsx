import { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

import { createAddress, updateAddress } from "@/api/addressService";
import { getApiErrorMessage } from "@/api/apiError";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { FormError } from "@/components/FormError";
import { colors, fontSize, spacing } from "@/theme";
import type { Address } from "@/types/address";

interface Props {
  address?: Address;
  onSaved: (address: Address) => void;
  onCancel: () => void;
  hasExistingAddresses: boolean;
}

function initialForm(address?: Address) {
  return {
    label: address?.label ?? "",
    fullName: address?.fullName ?? "",
    phone: address?.phone ?? "",
    address: address?.address ?? "",
    city: address?.city ?? "",
    department: address?.department ?? "",
    additionalInstructions: address?.additionalInstructions ?? "",
  };
}

export function AddressForm({ address, onSaved, onCancel, hasExistingAddresses }: Props) {
  const [form, setForm] = useState(() => initialForm(address));
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(address);

  const set = (field: keyof ReturnType<typeof initialForm>, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (
      !form.label.trim() ||
      !form.fullName.trim() ||
      !form.department.trim() ||
      !form.city.trim() ||
      !form.address.trim() ||
      !form.phone.trim()
    ) {
      setError(
        "Completa nombre de referencia, nombre completo, departamento, ciudad, dirección y teléfono.",
      );
      return;
    }

    const payload = {
      label: form.label.trim(),
      fullName: form.fullName.trim(),
      country: "Colombia",
      department: form.department.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      additionalInstructions: form.additionalInstructions.trim() || undefined,
    };

    try {
      setSaving(true);
      setError(null);

      const saved = address
        ? await updateAddress(address.id, payload)
        : await createAddress({ ...payload, isDefault });

      onSaved(saved);
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo guardar la dirección."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <FormError message={error} />

      <TextField
        label="Nombre de referencia"
        icon="pricetag-outline"
        placeholder="Casa, Oficina, Apartamento..."
        value={form.label}
        onChangeText={(value) => set("label", value)}
      />

      <TextField
        label="Nombre completo"
        icon="person-outline"
        value={form.fullName}
        onChangeText={(value) => set("fullName", value)}
        autoCapitalize="words"
      />

      <TextField
        label="Teléfono"
        icon="call-outline"
        keyboardType="phone-pad"
        value={form.phone}
        onChangeText={(value) => set("phone", value)}
      />

      <TextField
        label="Dirección"
        icon="location-outline"
        value={form.address}
        onChangeText={(value) => set("address", value)}
      />

      <TextField
        label="Ciudad"
        icon="business-outline"
        value={form.city}
        onChangeText={(value) => set("city", value)}
      />

      <TextField
        label="Departamento"
        icon="map-outline"
        value={form.department}
        onChangeText={(value) => set("department", value)}
      />

      <TextField
        label="Indicaciones adicionales (opcional)"
        icon="document-text-outline"
        placeholder="Ej. Apartamento 302, portería azul..."
        value={form.additionalInstructions}
        onChangeText={(value) => set("additionalInstructions", value)}
      />

      {!isEdit && hasExistingAddresses && (
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Marcar como dirección principal</Text>
          <Switch
            value={isDefault}
            onValueChange={setIsDefault}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.background}
          />
        </View>
      )}

      <View style={styles.actions}>
        <Button label="Cancelar" variant="outline" onPress={onCancel} style={styles.action} />
        <Button
          label={saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Guardar dirección"}
          onPress={handleSubmit}
          loading={saving}
          style={styles.action}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  toggleLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  action: {
    flex: 1,
  },
});
