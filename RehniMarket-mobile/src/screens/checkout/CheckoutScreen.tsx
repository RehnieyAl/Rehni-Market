import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useCart } from "@/features/cart/hooks/useCart";
import { getAddresses } from "@/api/addressService";
import { getMyWallet } from "@/api/walletService";
import { checkout } from "@/api/checkoutService";
import { getApiErrorDetail, getApiErrorMessage } from "@/api/apiError";
import { ErrorCode } from "@/types/ErrorCode";
import { AddressSheet } from "@/features/addresses/components/AddressSheet";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/Button";
import { CheckoutSteps } from "@/components/ui/CheckoutSteps";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { formatPrice } from "@/utils/formatPrice";
import { useResponsive } from "@/hooks/useResponsive";
import { colors, fontSize, fontWeight, radii, shadows, spacing } from "@/theme";
import type { Address } from "@/types/address";
import type { CheckoutSummary } from "@/types/checkout";

export function CheckoutScreen() {
  const router = useRouter();
  const responsive = useResponsive();
  const { cart, loading: cartLoading, refreshCart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [walletBalance, setWalletBalance] = useState("0");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<CheckoutSummary | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [addressList, wallet] = await Promise.all([getAddresses(), getMyWallet()]);
        if (cancelled) return;

        setAddresses(addressList);
        setWalletBalance(wallet.balance);

        const preferred = addressList.find((a) => a.isDefault) ?? addressList[0] ?? null;
        setSelectedAddress(preferred);
        if (!preferred) setSheetOpen(true);
      } catch (error) {
        console.error("Error cargando datos de checkout:", error);
      } finally {
        if (!cancelled) setDataLoaded(true);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const items = cart?.items ?? [];
  const twoColumn = responsive.atLeast("lg");

  const subtotal = cart?.subtotal ?? "0";
  const tax = cart?.tax ?? "0";
  const total = cart?.total ?? "0";
  const hasEnoughBalance = Number(walletBalance) >= Number(total);

  const handleAddressAdded = (address: Address) => {
    setAddresses((prev) => [address, ...prev.filter((a) => a.id !== address.id)]);
    setSelectedAddress(address);
    setSheetOpen(false);
  };

  const handleConfirm = async () => {
    if (!selectedAddress) {
      setSheetOpen(true);
      return;
    }

    try {
      setConfirming(true);
      const summary = await checkout({ addressId: selectedAddress.id });
      await refreshCart();
      setResult(summary);
    } catch (error) {
      const detail = getApiErrorDetail(error);

      if (detail?.code === ErrorCode.ADDRESS_REQUIRED) {
        setSheetOpen(true);
        return;
      }

      if (
        detail?.code === ErrorCode.INSUFFICIENT_STOCK ||
        detail?.code === ErrorCode.PRODUCT_NOT_FOUND ||
        detail?.code === ErrorCode.VARIANT_NOT_FOUND
      ) {
        await refreshCart();
        Alert.alert(
          "Producto no disponible",
          detail.message ?? "Un producto de tu carrito ya no está disponible.",
        );
        return;
      }

      Alert.alert(
        "No se pudo completar la compra",
        getApiErrorMessage(error, "Intenta de nuevo."),
      );
    } finally {
      setConfirming(false);
    }
  };

  if (result) {
    const firstOrder = result.orders[0] ?? null;
    const reference =
      result.orders.length === 1 && firstOrder ? firstOrder.reference : null;

    return (
      <ScreenContainer scroll maxWidth={560}>
        <View style={styles.successBox}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={40} color={colors.success} />
            </View>
            <Text style={styles.successTitle}>¡Compra confirmada!</Text>
            <Text style={styles.successText}>
              {result.orders.length > 1
                ? `Creamos ${result.orders.length} pedidos (uno por tienda). Podrás seguir su estado desde tu cuenta.`
                : "Tu pedido ha sido realizado con éxito."}
            </Text>
            {reference && <Text style={styles.successRef}>Pedido {reference}</Text>}

            <View style={styles.paidCard}>
              <View style={styles.paidRow}>
                <Text style={styles.paidLabel}>Total pagado</Text>
                <Text style={styles.paidValue}>{formatPrice(result.total)}</Text>
              </View>
              <Text style={styles.paidNote}>
                Pagada con RehniCoin · saldo restante {formatPrice(result.walletBalance)}
              </Text>
            </View>

            <Text style={styles.successText}>
              Recibirás un correo con los detalles de tu compra.
            </Text>

            <Button
              label="Seguir comprando"
              onPress={() => router.replace("/(user)")}
              style={styles.successButton}
            />
          <Button
            label="Ver mis pedidos"
            variant="outline"
            onPress={() => router.replace("/(user)/orders")}
            style={styles.successButtonSecondary}
          />
        </View>
      </ScreenContainer>
    );
  }

  if (cartLoading || !dataLoaded) {
    return (
      <ScreenContainer maxWidth={twoColumn ? undefined : 640}>
        <Text style={styles.title}>Checkout</Text>
        <View style={styles.skeletons}>
          <Skeleton height={120} radius="lg" />
          <Skeleton height={140} radius="lg" />
          <Skeleton height={180} radius="lg" />
        </View>
      </ScreenContainer>
    );
  }

  if (items.length === 0) {
    return (
      <ScreenContainer maxWidth={640}>
        <Text style={styles.title}>Checkout</Text>
        <EmptyState
          icon="cart-outline"
          message="Tu carrito está vacío. Agrega productos para continuar con tu compra."
          action={
            <Button label="Explorar productos" onPress={() => router.push("/(user)/products")} />
          }
        />
      </ScreenContainer>
    );
  }

  const addressCard = (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderTitle}>
          <Ionicons name="location-outline" size={18} color={colors.textMuted} />
          <Text style={styles.cardTitle}>Dirección de envío</Text>
        </View>

        {selectedAddress && (
          <Pressable onPress={() => setSheetOpen(true)} hitSlop={8}>
            <Text style={styles.link}>Cambiar</Text>
          </Pressable>
        )}
      </View>

      {selectedAddress ? (
        <View style={styles.addressBlock}>
          <Text style={styles.addressName}>
            {selectedAddress.label ?? "Dirección"}
            {selectedAddress.fullName ? ` · ${selectedAddress.fullName}` : ""}
          </Text>
          <Text style={styles.addressText}>
            {selectedAddress.address}, {selectedAddress.city}, {selectedAddress.department}
          </Text>
          <Text style={styles.addressText}>Tel: {selectedAddress.phone}</Text>
        </View>
      ) : (
        <Pressable onPress={() => setSheetOpen(true)} style={styles.addAddressButton}>
          <Text style={styles.link}>+ Agregar dirección de entrega</Text>
        </Pressable>
      )}
    </View>
  );

  const productsCard = (
    <View style={styles.card}>
      <Pressable
        style={styles.collapsibleHeader}
        onPress={() => setSummaryOpen((open) => !open)}
        hitSlop={8}
      >
        <Text style={styles.cardTitle}>
          Resumen de productos ({items.length})
        </Text>
        <Ionicons
          name={summaryOpen ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textMuted}
        />
      </Pressable>

      {summaryOpen && (
      <View style={styles.recap}>
        {items.map((item, index) => {
          const label =
            item.options.length > 0
              ? item.options.map((option) => option.value).join(" / ")
              : (item.color?.name ?? item.variantName);

          return (
            <View
              key={item.id}
              style={[styles.recapRow, index > 0 && styles.recapRowDivider]}
            >
              <Text style={styles.recapName}>
                {item.quantity} × {item.name}
                {label ? ` (${label})` : ""}
              </Text>
              <Text style={styles.recapPrice}>{formatPrice(item.subtotal)}</Text>
            </View>
          );
        })}
      </View>
      )}
    </View>
  );

  const summaryCard = (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Resumen</Text>

      <View style={styles.summaryRows}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>IVA</Text>
          <Text style={styles.summaryValue}>
            {Number(tax) > 0 ? formatPrice(tax) : "No aplica"}
          </Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalLabel}>{formatPrice(total)}</Text>
        </View>
      </View>

      <View style={styles.walletBox}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Saldo RehniCoin</Text>
          <Text style={styles.walletValue}>{formatPrice(walletBalance)}</Text>
        </View>
        {!hasEnoughBalance && (
          <Text style={styles.walletWarning}>
            Tu saldo RehniCoin no alcanza para esta compra.
          </Text>
        )}
      </View>

      <Button
        label={
          confirming
            ? "Confirmando..."
            : selectedAddress
              ? "Confirmar compra"
              : "Elegir dirección para continuar"
        }
        onPress={handleConfirm}
        loading={confirming}
        disabled={!hasEnoughBalance}
        style={styles.confirmButton}
      />
    </View>
  );

  return (
    <>
      <ScreenContainer scroll maxWidth={twoColumn ? undefined : 640}>
        <Text style={styles.title}>Checkout</Text>
        <Text style={styles.subtitle}>Confirma tu dirección y paga con RehniCoin.</Text>

        <CheckoutSteps current={selectedAddress ? 1 : 0} />

        {twoColumn ? (
          <View style={styles.row}>
            <View style={styles.leftColumn}>
              {addressCard}
              {productsCard}
            </View>
            <View style={styles.rightColumn}>{summaryCard}</View>
          </View>
        ) : (
          <View style={styles.stack}>
            {addressCard}
            {productsCard}
            {summaryCard}
          </View>
        )}
      </ScreenContainer>

      <AddressSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        addresses={addresses}
        selectedId={selectedAddress?.id ?? null}
        onSelect={setSelectedAddress}
        onAdded={handleAddressAdded}
      />
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    paddingTop: spacing.md,
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  skeletons: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  stack: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  leftColumn: {
    flex: 1,
    gap: spacing.lg,
  },
  rightColumn: {
    width: "100%",
    maxWidth: 360,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  cardHeaderTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  link: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  addressBlock: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 2,
  },
  addressName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  addressText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  addAddressButton: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderStyle: "dashed",
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  collapsibleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  recap: {
    gap: 0,
  },
  recapRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  recapRowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  recapName: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  recapPrice: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  summaryRows: {
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  totalLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  walletBox: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  walletValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  walletWarning: {
    fontSize: fontSize.xs,
    color: colors.danger,
  },
  confirmButton: {
    marginTop: spacing.xs,
  },
  successBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
    backgroundColor: colors.successMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  successTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: "center",
  },
  successText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },
  successRef: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  paidCard: {
    alignSelf: "stretch",
    marginTop: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.xs,
  },
  paidRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paidLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  paidValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  paidNote: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  successButton: {
    marginTop: spacing.lg,
    minWidth: 220,
    alignSelf: "stretch",
  },
  successButtonSecondary: {
    marginTop: spacing.sm,
    minWidth: 220,
    alignSelf: "stretch",
  },
});
