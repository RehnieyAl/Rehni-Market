import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { getProductDetail } from "@/api/productService";
import { useCart } from "@/features/cart/hooks/useCart";
import { useFavorites } from "@/features/favorites/hooks/useFavorites";
import { getApiErrorDetail, getApiErrorMessage } from "@/api/apiError";
import { consumePendingAction } from "@/api/session";
import type { PendingAction } from "@/api/session";
import { useRequireUser } from "@/features/auth/hooks/useRequireUser";
import { ErrorCode } from "@/types/ErrorCode";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { formatPrice } from "@/utils/formatPrice";
import { deriveVariantAxes, firstLiveVariant, resolveVariant } from "@/utils/variantAxes";
import { useResponsive } from "@/hooks/useResponsive";
import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";
import type { PublicProductDetail } from "@/types/product";

import { QuantityStepper } from "@/components/product/QuantityStepper";
import { ProductGallery } from "./components/ProductGallery";
import { ProductInfo } from "./components/ProductInfo";
import { ProductTaxLine } from "./components/ProductTaxLine";
import { SellerCard } from "./components/SellerCard";
import { VariantSelector } from "./components/VariantSelector";
import { StockStatus } from "./components/StockStatus";

interface Props {
  productId: string;
}

const JUST_ADDED_RESET_MS = 2500;

export function ProductDetailScreen({ productId }: Props) {
  const router = useRouter();
  const requireUser = useRequireUser();
  const responsive = useResponsive();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [product, setProduct] = useState<PublicProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [failed, setFailed] = useState(false);

  const [selected, setSelected] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  const [addingToCart, setAddingToCart] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const [resumeAction, setResumeAction] = useState<PendingAction | null>(null);

  const load = useCallback(async () => {
    if (!productId) return;

    try {
      setLoading(true);
      setNotFound(false);
      setFailed(false);

      const response = await getProductDetail(productId);

      setProduct(response);
      setSelected({});
      setQuantity(1);
    } catch (error) {
      console.error("Error cargando el producto:", error);

      const detail = getApiErrorDetail(error);

      if (detail?.code === ErrorCode.PRODUCT_NOT_FOUND) {
        setNotFound(true);
      } else {
        setFailed(true);
      }
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const axes = useMemo(
    () => (product ? deriveVariantAxes(product.variants) : []),
    [product],
  );
  const requiresVariant = axes.length > 0;
  const allAxesChosen = requiresVariant && axes.every((axis) => selected[axis.name]);

  const activeVariant = useMemo(
    () =>
      product && allAxesChosen ? resolveVariant(product.variants, axes, selected) : null,
    [product, axes, selected, allAxesChosen],
  );
  const invalidCombination = allAxesChosen && activeVariant === null;
  const hasChosenVariant = activeVariant !== null;

  const anyVariantInStock = useMemo(
    () => (product?.variants ?? []).some((variant) => variant.stock > 0),
    [product],
  );

  const canAddToCart = !requiresVariant || activeVariant !== null;

  const firstVariant = useMemo(
    () => (product ? firstLiveVariant(product.variants) : null),
    [product],
  );

  const images = useMemo(() => {
    if (!product) return [];

    if (activeVariant && activeVariant.images.length > 0) return activeVariant.images;

    const chosen = Object.entries(selected).filter(([, value]) => Boolean(value));
    if (chosen.length > 0) {
      const representative = product.variants.find((variant) => {
        if (variant.images.length === 0) return false;
        const optionValues = Object.fromEntries(
          variant.options.map((option) => [option.attribute, option.value]),
        );
        return chosen.every(([name, value]) => optionValues[name] === value);
      });
      if (representative) return representative.images;
    }

    if (firstVariant && firstVariant.images.length > 0) return firstVariant.images;

    return product.images ?? [];
  }, [product, activeVariant, selected, firstVariant]);

  const stock = activeVariant ? activeVariant.stock : (product?.stock ?? 0);
  const displayPrice = activeVariant ? activeVariant.price : (product?.price ?? "0");
  const displayFinalPrice = activeVariant
    ? activeVariant.final_price
    : (product?.final_price ?? "0");
  const discountEnabled = activeVariant
    ? activeVariant.discount_enabled
    : (product?.discount_enabled ?? false);
  const discountPercentage = activeVariant
    ? activeVariant.discount_percentage
    : (product?.discount_percentage ?? null);
  const displayTaxAmount = activeVariant
    ? activeVariant.tax_amount
    : (product?.tax_amount ?? "0");
  const displayPriceWithTax = activeVariant
    ? activeVariant.final_price_with_tax
    : (product?.price_with_tax ?? "0");

  const handleAxisChange = (attributeName: string, value: string) => {
    const axisIndex = axes.findIndex((axis) => axis.name === attributeName);
    const priorNames = axes
      .slice(0, axisIndex < 0 ? 0 : axisIndex)
      .map((axis) => axis.name);

    setSelected((prev) => {
      const next: Record<string, string> = {};
      priorNames.forEach((name) => {
        if (prev[name]) next[name] = prev[name];
      });
      next[attributeName] = value;
      return next;
    });
    setQuantity(1);
    setJustAdded(false);
  };

  const handleAddToCart = useCallback(async () => {
    if (!product || !canAddToCart || stock <= 0 || addingToCart) return;

    const allowed = requireUser({
      type: "ADD_TO_CART",
      productId: product.id,
      variantId: activeVariant?.id ?? null,
      quantity,
    });

    if (!allowed) return;

    try {
      setAddingToCart(true);
      await addItem(product.id, quantity, activeVariant?.id);
      setJustAdded(true);
    } catch (error) {
      Alert.alert(
        "No se pudo agregar",
        getApiErrorMessage(error, "No se pudo agregar el producto al carrito."),
      );
    } finally {
      setAddingToCart(false);
    }
  }, [
    product,
    canAddToCart,
    stock,
    addingToCart,
    requireUser,
    activeVariant,
    quantity,
    addItem,
  ]);

  const handleShare = () => {
    if (!product) return;

    Share.share({
      message: `${product.name} - ${formatPrice(discountEnabled ? displayFinalPrice : displayPrice)}`,
    }).catch(() => {});
  };

  const handleToggleFavorite = () => {
    if (!product || !requireUser()) return;

    toggleFavorite(product.id).catch((error) =>
      Alert.alert("No se pudo actualizar", getApiErrorMessage(error, "Intenta de nuevo.")),
    );
  };

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), JUST_ADDED_RESET_MS);
    return () => clearTimeout(timer);
  }, [justAdded]);

  useEffect(() => {
    if (!product) return;

    const pending = consumePendingAction();
    if (!pending || pending.type !== "ADD_TO_CART" || pending.productId !== product.id) return;

    if (pending.variantId) {
      const variant = product.variants.find((candidate) => candidate.id === pending.variantId);
      if (variant) {
        setSelected(
          Object.fromEntries(variant.options.map((option) => [option.attribute, option.value])),
        );
      }
    }

    setQuantity(pending.quantity);
    setResumeAction(pending);
  }, [product]);

  useEffect(() => {
    if (!resumeAction) return;

    setResumeAction(null);
    handleAddToCart();
  }, [resumeAction, handleAddToCart]);

  const twoColumn =
    responsive.atLeast("lg") || (responsive.atLeast("md") && responsive.isLandscape);
  const frameMaxWidth = twoColumn
    ? Math.min(responsive.contentMaxWidth, 1080)
    : Math.min(responsive.contentMaxWidth, 600);
  const frameWidth = Math.min(responsive.width, frameMaxWidth);
  const innerWidth = frameWidth - spacing.lg * 2;
  const galleryWidth = twoColumn
    ? Math.min(440, Math.round(innerWidth * 0.46))
    : Math.min(460, innerWidth);

  const ctaDisabled =
    !canAddToCart || stock <= 0 || addingToCart || invalidCombination;

  const gallery = (
    <ProductGallery
      key={activeVariant?.id ?? "base"}
      images={images}
      productName={product?.name ?? ""}
      width={galleryWidth}
    />
  );

  const infoBlocks = product && (
    <>
      <ProductInfo
        catalogName={product.catalog_name}
        name={product.name}
        price={displayPrice}
        discountEnabled={discountEnabled}
        discountPercentage={discountPercentage}
        finalPrice={displayFinalPrice}
        averageRating={product.average_rating}
        reviewCount={product.review_count}
      />

      <ProductTaxLine
        appliesTax={product.applies_tax}
        taxRate={product.tax_rate}
        taxAmount={displayTaxAmount}
        priceWithTax={displayPriceWithTax}
      />

      <SellerCard
        companyName={product.company_name}
        companyLogo={product.company_logo}
        isVerified={product.company_is_verified}
      />

      {requiresVariant && (
        <VariantSelector
          variants={product.variants}
          selected={selected}
          onChange={handleAxisChange}
        />
      )}

      <StockStatus
        requiresVariant={requiresVariant}
        hasChosenVariant={hasChosenVariant}
        anyVariantInStock={anyVariantInStock}
        stock={stock}
      />

      {invalidCombination ? (
        <Text style={styles.selectVariantHint}>Esa combinación no está disponible.</Text>
      ) : requiresVariant && !allAxesChosen ? (
        <Text style={styles.selectVariantHint}>
          Elige {axes.length === 1 ? "una opción" : "todas las opciones"} para continuar.
        </Text>
      ) : null}

      <View style={styles.buyRow}>
        <QuantityStepper
          value={quantity}
          max={stock}
          onChange={setQuantity}
          disabled={stock <= 0}
        />

        <Pressable
          style={[styles.cta, ctaDisabled && styles.ctaDisabled]}
          disabled={ctaDisabled}
          onPress={handleAddToCart}
        >
          {addingToCart ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <>
              <Ionicons
                name={justAdded ? "checkmark" : "cart-outline"}
                size={18}
                color={colors.textOnPrimary}
              />
              <Text style={styles.ctaText}>
                {justAdded ? "Agregado" : "Agregar al carrito"}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </>
  );

  const description = product?.descripcion ? (
    <View style={styles.description}>
      <Text style={styles.descriptionTitle}>Descripción</Text>
      <Text style={styles.descriptionText}>{product.descripcion}</Text>
    </View>
  ) : null;

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={responsive.isLandscape ? ["top", "left", "right"] : ["top"]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>

        {product && (
          <View style={styles.headerActions}>
            <Pressable
              onPress={handleToggleFavorite}
              hitSlop={8}
              accessibilityLabel={
                isFavorite(product.id) ? "Quitar de favoritos" : "Agregar a favoritos"
              }
            >
              <Ionicons
                name={isFavorite(product.id) ? "heart" : "heart-outline"}
                size={22}
                color={isFavorite(product.id) ? colors.primary : colors.textPrimary}
              />
            </Pressable>

            <Pressable onPress={handleShare} hitSlop={8} accessibilityLabel="Compartir">
              <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.stateOuter}>
          <View style={[styles.stateContent, { maxWidth: frameMaxWidth }]}>
            <Skeleton height={galleryWidth} radius="lg" />
            <Skeleton width="40%" height={14} />
            <Skeleton width="85%" height={26} />
            <Skeleton width="45%" height={26} />
            <Skeleton height={64} radius="md" />
            <Skeleton height={48} radius="md" />
          </View>
        </View>
      ) : notFound ? (
        <View style={styles.centerContent}>
          <EmptyState icon="cube-outline" message="No encontramos este producto." />

          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Volver</Text>
          </Pressable>
        </View>
      ) : failed ? (
        <View style={styles.centerContent}>
          <ErrorState message="No se pudo cargar el producto." onRetry={load} />
        </View>
      ) : product ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.frame, { maxWidth: frameMaxWidth }]}>
            {twoColumn ? (
              <>
                <View style={styles.row}>
                  <View style={{ width: galleryWidth }}>{gallery}</View>
                  <View style={styles.infoColumn}>{infoBlocks}</View>
                </View>
                {description}
              </>
            ) : (
              <>
                <View style={styles.galleryCenter}>{gallery}</View>
                {infoBlocks}
                {description}
              </>
            )}
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: spacing.xxl,
  },
  frame: {
    width: "100%",
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xl,
  },
  infoColumn: {
    flex: 1,
    maxWidth: 560,
    gap: spacing.lg,
  },
  galleryCenter: {
    alignSelf: "center",
  },
  stateOuter: {
    alignItems: "center",
  },
  stateContent: {
    width: "100%",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  backLink: {
    alignSelf: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  backLinkText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  description: {
    gap: spacing.xs,
  },
  descriptionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  descriptionText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  selectVariantHint: {
    marginTop: -spacing.sm,
    fontSize: fontSize.sm,
    color: colors.warning,
  },
  buyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  cta: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textOnPrimary,
  },
});
