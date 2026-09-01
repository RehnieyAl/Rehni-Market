import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/Button";
import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";
import type { PublicCatalog } from "@/types/catalog";

export interface CatalogFilters {
  catalogId: string | null;
  minPrice: string;
  maxPrice: string;
  discountOnly: boolean;
  inStockOnly: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  catalogs: PublicCatalog[];
  value: CatalogFilters;
  onApply: (value: CatalogFilters) => void;
}

const EMPTY: CatalogFilters = {
  catalogId: null,
  minPrice: "",
  maxPrice: "",
  discountOnly: false,
  inStockOnly: false,
};

export function FiltersSheet({ visible, onClose, catalogs, value, onApply }: Props) {
  const [draft, setDraft] = useState<CatalogFilters>(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  const set = <K extends keyof CatalogFilters>(key: K, next: CatalogFilters[K]) =>
    setDraft((prev) => ({ ...prev, [key]: next }));

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Filtros"
      footer={
        <>
          <Button label="Aplicar" onPress={() => onApply(draft)} />
          <Button label="Limpiar filtros" variant="outline" onPress={() => onApply(EMPTY)} />
        </>
      }
    >
      <View style={styles.group}>
        <Text style={styles.groupLabel}>Categoría</Text>
        <View style={styles.chips}>
          <Pressable
            onPress={() => set("catalogId", null)}
            style={[styles.chip, draft.catalogId === null && styles.chipActive]}
          >
            <Text style={[styles.chipText, draft.catalogId === null && styles.chipTextActive]}>
              Todas
            </Text>
          </Pressable>

          {catalogs.map((catalog) => {
            const active = draft.catalogId === catalog.id;

            return (
              <Pressable
                key={catalog.id}
                onPress={() => set("catalogId", catalog.id)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {catalog.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.group}>
        <Text style={styles.groupLabel}>Rango de precio</Text>
        <View style={styles.priceRow}>
          <TextInput
            value={draft.minPrice}
            onChangeText={(text) => set("minPrice", text.replace(/[^0-9]/g, ""))}
            placeholder="Mínimo"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            style={styles.priceInput}
          />
          <Text style={styles.priceDash}>–</Text>
          <TextInput
            value={draft.maxPrice}
            onChangeText={(text) => set("maxPrice", text.replace(/[^0-9]/g, ""))}
            placeholder="Máximo"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            style={styles.priceInput}
          />
        </View>
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Solo con descuento</Text>
        <Switch
          value={draft.discountOnly}
          onValueChange={(next) => set("discountOnly", next)}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor={colors.background}
        />
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Solo disponibles</Text>
        <Switch
          value={draft.inStockOnly}
          onValueChange={(next) => set("inStockOnly", next)}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor={colors.background}
        />
      </View>
    </Sheet>
  );
}

export { EMPTY as EMPTY_CATALOG_FILTERS };

const styles = StyleSheet.create({
  group: {
    gap: spacing.sm,
  },
  groupLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.textMuted,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  priceInput: {
    flex: 1,
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.base,
    color: colors.textPrimary,
  },
  priceDash: {
    color: colors.textMuted,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleLabel: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
  },
});
