import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Sheet } from "@/components/ui/Sheet";
import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";
import type { Address } from "@/types/address";

import { AddressForm } from "./AddressForm";

interface Props {
  visible: boolean;
  onClose: () => void;
  addresses: Address[];
  selectedId: string | null;
  onSelect: (address: Address) => void;
  onAdded: (address: Address) => void;
}

export function AddressSheet({
  visible,
  onClose,
  addresses,
  selectedId,
  onSelect,
  onAdded,
}: Props) {
  const [showForm, setShowForm] = useState(addresses.length === 0);

  useEffect(() => {
    if (visible) setShowForm(addresses.length === 0);
  }, [visible, addresses.length]);

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={showForm ? "Nueva dirección" : "Dirección de entrega"}
    >
      {showForm ? (
        <AddressForm
          hasExistingAddresses={addresses.length > 0}
          onSaved={(address) => {
            onAdded(address);
            setShowForm(false);
          }}
          onCancel={() => (addresses.length > 0 ? setShowForm(false) : onClose())}
        />
      ) : (
        <View style={styles.list}>
          {addresses.map((address) => {
            const active = address.id === selectedId;

            return (
              <Pressable
                key={address.id}
                onPress={() => {
                  onSelect(address);
                  onClose();
                }}
                style={[styles.option, active && styles.optionActive]}
              >
                <Ionicons
                  name={active ? "radio-button-on" : "radio-button-off"}
                  size={18}
                  color={active ? colors.primary : colors.textMuted}
                  style={styles.radio}
                />

                <View style={styles.optionBody}>
                  <Text style={styles.optionTitle}>
                    {address.label ?? "Dirección"}
                    {address.isDefault ? "  ·  Predeterminada" : ""}
                  </Text>
                  <Text style={styles.optionText}>
                    {address.address}, {address.city}, {address.department}
                  </Text>
                  <Text style={styles.optionText}>Tel: {address.phone}</Text>
                </View>
              </Pressable>
            );
          })}

          <Pressable onPress={() => setShowForm(true)} style={styles.addButton}>
            <Ionicons name="add" size={18} color={colors.primary} />
            <Text style={styles.addText}>Agregar otra dirección</Text>
          </Pressable>
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  option: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  optionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  radio: {
    marginTop: 1,
  },
  optionBody: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  optionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  addText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
});
