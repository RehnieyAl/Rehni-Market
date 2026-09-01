import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  deleteAddress,
  getAddresses,
  setDefaultAddress,
} from "@/api/addressService";
import { getApiErrorMessage } from "@/api/apiError";
import { AddressForm } from "@/features/addresses/components/AddressForm";
import { Sheet } from "@/components/ui/Sheet";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { colors, fontSize, fontWeight, radii, shadows, spacing } from "@/theme";
import type { Address } from "@/types/address";

type SheetMode = { type: "create" } | { type: "edit"; address: Address } | null;

export function AddressesScreen() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sheet, setSheet] = useState<SheetMode>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);
    setFailed(false);

    try {
      setAddresses(await getAddresses());
    } catch (error) {
      console.error("Error cargando direcciones:", error);
      setFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleSaved = (saved: Address) => {
    setAddresses((prev) => {
      const exists = prev.some((a) => a.id === saved.id);
      const next = exists ? prev.map((a) => (a.id === saved.id ? saved : a)) : [saved, ...prev];
      return saved.isDefault ? next.map((a) => ({ ...a, isDefault: a.id === saved.id })) : next;
    });
    setSheet(null);
  };

  const handleSetDefault = async (address: Address) => {
    setPendingId(address.id);
    try {
      await setDefaultAddress(address.id);
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === address.id })),
      );
    } catch (error) {
      Alert.alert("No se pudo actualizar", getApiErrorMessage(error, "Intenta de nuevo."));
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = (address: Address) => {
    Alert.alert("Eliminar dirección", `¿Eliminar "${address.label ?? "esta dirección"}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          setPendingId(address.id);
          try {
            await deleteAddress(address.id);
            setAddresses((prev) => prev.filter((a) => a.id !== address.id));
          } catch (error) {
            Alert.alert("No se pudo eliminar", getApiErrorMessage(error, "Intenta de nuevo."));
          } finally {
            setPendingId(null);
          }
        },
      },
    ]);
  };

  const addButton = (
    <Button
      label="Agregar dirección"
      onPress={() => setSheet({ type: "create" })}
      style={styles.addButton}
    />
  );

  let body: ReactNode;

  if (loading) {
    body = (
      <View style={styles.list}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} height={110} radius="lg" />
        ))}
      </View>
    );
  } else if (failed) {
    body = <ErrorState message="No pudimos cargar tus direcciones." onRetry={load} />;
  } else if (addresses.length === 0) {
    body = (
      <EmptyState
        icon="location-outline"
        message="Aún no has registrado direcciones. Agrega una para agilizar tus próximas compras."
        action={addButton}
      />
    );
  } else {
    body = (
      <View style={styles.list}>
        {addresses.map((address) => {
          const busy = pendingId === address.id;

          return (
            <View key={address.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{address.label ?? "Dirección"}</Text>
                {address.isDefault && <Badge tone="brand" label="Predeterminada" />}
              </View>

              {address.fullName && <Text style={styles.cardText}>{address.fullName}</Text>}
              <Text style={styles.cardText}>
                {address.address}, {address.city}, {address.department}
              </Text>
              <Text style={styles.cardText}>Tel: {address.phone}</Text>

              <View style={styles.cardActions}>
                {!address.isDefault && (
                  <Pressable
                    onPress={() => handleSetDefault(address)}
                    disabled={busy}
                    hitSlop={6}
                  >
                    <Text style={styles.actionLink}>Hacer predeterminada</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => setSheet({ type: "edit", address })}
                  disabled={busy}
                  hitSlop={6}
                >
                  <Text style={styles.actionLink}>Editar</Text>
                </Pressable>
                <Pressable onPress={() => handleDelete(address)} disabled={busy} hitSlop={6}>
                  <Text style={styles.actionDanger}>Eliminar</Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        {addButton}
      </View>
    );
  }

  return (
    <>
      <ScreenContainer
        scroll
        refreshing={refreshing}
        onRefresh={() => load("refresh")}
      >
        <View style={styles.header}>
          <Ionicons name="location-outline" size={20} color={colors.textMuted} />
          <Text style={styles.title}>Direcciones</Text>
        </View>

        {body}
      </ScreenContainer>

      <Sheet
        visible={sheet !== null}
        onClose={() => setSheet(null)}
        title={sheet?.type === "edit" ? "Editar dirección" : "Nueva dirección"}
      >
        {sheet !== null && (
          <AddressForm
            address={sheet.type === "edit" ? sheet.address : undefined}
            hasExistingAddresses={addresses.length > 0}
            onSaved={handleSaved}
            onCancel={() => setSheet(null)}
          />
        )}
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  cardText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  cardActions: {
    marginTop: spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
  },
  actionLink: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  actionDanger: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.danger,
  },
  addButton: {
    marginTop: spacing.xs,
  },
});
