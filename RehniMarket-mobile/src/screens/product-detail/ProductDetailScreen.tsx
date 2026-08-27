import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { getProductDetail } from "@/api/productService";
import { getApiErrorDetail } from "@/api/apiError";
import { consumePendingAction } from "@/api/session";
import type { PendingAction } from "@/api/session";
import { useRequireUser } from "@/features/auth/hooks/useRequireUser";
import { ErrorCode } from "@/types/ErrorCode";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { formatPrice } from "@/utils/formatPrice";
import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";
import type { PublicProductDetail, PublicProductVariant } from "@/types/product";

import { ProductGallery } from "./components/ProductGallery";
import { ProductInfo } from "./components/ProductInfo";
import { SellerCard } from "./components/SellerCard";
import { VariantSelector } from "./components/VariantSelector";
import type { ColorOption } from "./components/VariantSelector";
import { QuantitySelector } from "./components/QuantitySelector";
import { StockStatus } from "./components/StockStatus";

interface Props {
  productId: string;
}

interface ColorOptionInternal extends ColorOption {
  variant: PublicProductVariant | null;
}

// Detalle real de producto (ver references/ux-user.png > panel de
// detalle + RehniMarket-frontend/src/features/public/products/components/
// ProductDetail.tsx, misma fuente funcional). Mismo endpoint (GET
// /public/products/{id}) y misma regla de negocio de variantes/stock que
// la web - ver STOCK - REGLA CRÍTICA más abajo. NO incluye todavía:
// rating/reseñas, "Comprar ahora", productos relacionados ni reportar
// producto (ver Fase Product Detail > NO IMPLEMENTAR TODAVÍA) - esos
// existen en la web pero esta fase los deja fuera a propósito.
export function ProductDetailScreen({ productId }: Props) {
  const router = useRouter();
  const requireUser = useRequireUser();

  const [product, setProduct] = useState<PublicProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [failed, setFailed] = useState(false);

  // Variante activa (misma modelización que ProductDetail.tsx en la web):
  // `null` = datos del producto base. `hasChosenColor` existe aparte de
  // `selectedVariant !== null` porque elegir la swatch "base" (color
  // propio del producto, sin variante) también es una elección explícita
  // y debe habilitar la compra igual que elegir cualquier variante real.
  const [selectedVariant, setSelectedVariant] = useState<PublicProductVariant | null>(null);
  const [hasChosenColor, setHasChosenColor] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Favorito: UI provisional en estado local, sin persistencia todavía
  // (no existe FavoritesProvider - ver Fase Product Detail > FAVORITOS,
  // mismo criterio que ProductCard.tsx en Home).
  const [isFavorite, setIsFavorite] = useState(false);

  // Acción pendiente restaurada tras volver de Login (ver Fase Acceso
  // Público > PENDING ACTION) - `null` en el caso normal (entrada
  // directa, sin login de por medio). Ver los dos efectos de "resume" más
  // abajo.
  const [resumeAction, setResumeAction] = useState<PendingAction | null>(null);

  const load = useCallback(async () => {
    if (!productId) return;

    try {
      setLoading(true);
      setNotFound(false);
      setFailed(false);

      const response = await getProductDetail(productId);

      setProduct(response);
      setSelectedVariant(null);
      setHasChosenColor(false);
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

  // Colores seleccionables: color propio del producto ("base") + cada
  // variante con color. Las agotadas se incluyen igual, deshabilitadas -
  // NUNCA se quitan de la lista (ver STOCK - REGLA CRÍTICA abajo).
  const colorOptions = useMemo<ColorOptionInternal[]>(() => {
    if (!product) return [];

    const options: ColorOptionInternal[] = [];

    if (product.color) {
      options.push({
        key: "base",
        variant: null,
        hex: product.color.hex_color,
        name: product.color.name,
        outOfStock: product.stock <= 0,
      });
    }

    for (const variant of product.variants) {
      if (variant.color) {
        options.push({
          key: variant.id,
          variant,
          hex: variant.color.hex_color,
          name: variant.color.name,
          outOfStock: variant.stock <= 0,
        });
      }
    }

    return options;
  }, [product]);

  // STOCK - REGLA CRÍTICA (ver Fase Product Detail > 7): el stock del
  // producto principal (product.stock) NUNCA decide si una variante es
  // seleccionable. Ejemplo real: product.stock = 0 pero la variante
  // "Rojo" tiene stock = 5 → "Rojo" sigue apareciendo y puede elegirse
  // (mismo criterio que _has_visible_stock en publicService/Products.py
  // y que colorOptions/anyVariantInStock en ProductDetail.tsx web).
  const requiresVariant = (product?.variants.length ?? 0) > 0;
  const anyVariantInStock = colorOptions.some((option) => !option.outOfStock);
  const canAddToCart = !requiresVariant || hasChosenColor;

  // Datos "en pantalla": los de la variante elegida o, por defecto, los
  // del producto base - mismo patrón derivado que la web (nunca se
  // recalcula precio/descuento acá, el backend ya los resuelve).
  const images = selectedVariant ? selectedVariant.images : (product?.images ?? []);
  const stock = selectedVariant ? selectedVariant.stock : (product?.stock ?? 0);
  const displayPrice = selectedVariant ? selectedVariant.price : (product?.price ?? "0");
  const displayFinalPrice = selectedVariant
    ? selectedVariant.final_price
    : (product?.final_price ?? "0");
  const discountEnabled = selectedVariant
    ? selectedVariant.discount_enabled
    : (product?.discount_enabled ?? false);
  const discountPercentage = selectedVariant
    ? selectedVariant.discount_percentage
    : (product?.discount_percentage ?? null);

  // La swatch "base" se ve seleccionada por defecto (antes de elegir nada)
  // cuando existe, igual que en la web - el nombre en el título "Color: X"
  // solo aparece una vez que `hasChosenColor` es true.
  const selectedKey = selectedVariant?.id ?? "base";
  const selectedColorName = hasChosenColor
    ? (selectedVariant?.color?.name ?? product?.color?.name ?? null)
    : null;

  const handleSelectVariant = (key: string) => {
    const option = colorOptions.find((candidate) => candidate.key === key);
    if (!option || option.outOfStock) return;

    setSelectedVariant(option.variant);
    setHasChosenColor(true);
    setQuantity(1);
  };

  // Primera acción realmente protegida de la app (ver Fase Acceso Público
  // > PRODUCT DETAIL, punto 6): un visitante SÍ puede llegar hasta acá
  // (cargar el producto, elegir variante, cambiar cantidad - todo
  // público), pero tocar "Agregar al carrito" exige cuenta. `useCallback`
  // con las dependencias reales (no solo por prolijidad): el efecto de
  // resume de abajo depende de esta función para saber cuándo
  // stock/canAddToCart ya reflejan la variante/cantidad restauradas tras
  // volver de Login.
  const handleAddToCart = useCallback(() => {
    if (!product || !canAddToCart || stock <= 0) return;

    const allowed = requireUser({
      type: "ADD_TO_CART",
      productId: product.id,
      variantId: selectedVariant?.id ?? null,
      quantity,
    });

    if (!allowed) return;

    // No hay CartProvider todavía (ver Fase Product Detail > BOTÓN
    // PRINCIPAL): nada se guarda de forma permanente, solo se confirma la
    // selección con un Alert hasta que exista el carrito real.
    Alert.alert(
      "Carrito próximamente",
      `${product.name}${selectedColorName ? ` · ${selectedColorName}` : ""} · Cantidad: ${quantity}`,
    );
  }, [product, canAddToCart, stock, requireUser, selectedVariant, quantity, selectedColorName]);

  // Favorito: mismo gate centralizado que "Agregar al carrito" (ver Fase
  // Acceso Público > FAVORITOS, "no dejar lógica de autenticación
  // duplicada en cada componente") - sin resume tras login todavía (no
  // hay FavoritesProvider real que retomar, ver punto 19 NO IMPLEMENTAR
  // TODAVÍA), a diferencia de ADD_TO_CART.
  const handleToggleFavorite = () => {
    if (!product) return;

    const allowed = requireUser({
      type: "ADD_TO_FAVORITES",
      productId: product.id,
      variantId: selectedVariant?.id ?? null,
    });

    if (!allowed) return;

    setIsFavorite((prev) => !prev);
  };

  const handleShare = () => {
    if (!product) return;

    Share.share({
      message: `${product.name} - ${formatPrice(discountEnabled ? displayFinalPrice : displayPrice)}`,
    }).catch(() => {});
  };

  // Resume tras volver de Login (ver Fase Acceso Público > punto 7-8):
  // dos efectos porque hace falta esperar a que la variante/cantidad
  // restauradas ya se hayan aplicado al estado antes de reintentar
  // "Agregar al carrito" - llamarlo en el mismo efecto que hace los
  // setState leería `stock`/`canAddToCart` viejos (de ANTES de aplicar la
  // selección guardada).
  //
  // Efecto 1: al cargar el producto, si hay una acción pendiente PARA
  // ESTE producto, aplica la selección guardada (variante + cantidad).
  useEffect(() => {
    if (!product) return;

    const pending = consumePendingAction();
    if (!pending || pending.type !== "ADD_TO_CART" || pending.productId !== product.id) return;

    if (pending.variantId) {
      const variant = product.variants.find((candidate) => candidate.id === pending.variantId);
      setSelectedVariant(variant ?? null);
      setHasChosenColor(true);
    } else if (product.color) {
      setHasChosenColor(true);
    }

    setQuantity(pending.quantity);
    setResumeAction(pending);
  }, [product]);

  // Efecto 2: una vez que `handleAddToCart` ya refleja la variante/
  // cantidad restauradas (cambia de referencia cuando cambian sus
  // dependencias reales, ver el useCallback de arriba), retoma la acción
  // automáticamente - el visitante no tiene que repetir manualmente lo
  // que ya había elegido antes de que lo mandáramos a Login.
  useEffect(() => {
    if (!resumeAction) return;

    setResumeAction(null);
    handleAddToCart();
  }, [resumeAction, handleAddToCart]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>

        {product && (
          <View style={styles.headerActions}>
            <Pressable onPress={handleToggleFavorite} hitSlop={8}>
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={22}
                color={isFavorite ? colors.primary : colors.textPrimary}
              />
            </Pressable>

            <Pressable onPress={handleShare} hitSlop={8}>
              <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.scrollContent}>
          <Skeleton height={320} radius="lg" />
          <Skeleton width="40%" height={14} />
          <Skeleton width="85%" height={26} />
          <Skeleton width="45%" height={26} />
          <Skeleton height={64} radius="md" />
          <Skeleton height={48} radius="md" />
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ProductGallery key={selectedVariant?.id ?? "base"} images={images} productName={product.name} />

          <ProductInfo
            catalogName={product.catalog_name}
            name={product.name}
            price={displayPrice}
            discountEnabled={discountEnabled}
            discountPercentage={discountPercentage}
            finalPrice={displayFinalPrice}
          />

          <SellerCard
            companyName={product.company_name}
            companyLogo={product.company_logo}
            isVerified={product.company_is_verified}
          />

          {colorOptions.length > 0 && (
            <VariantSelector
              options={colorOptions}
              selectedKey={selectedKey}
              selectedName={selectedColorName}
              onSelect={handleSelectVariant}
            />
          )}

          <StockStatus
            requiresVariant={requiresVariant}
            hasChosenVariant={hasChosenColor}
            anyVariantInStock={anyVariantInStock}
            stock={stock}
          />

          <QuantitySelector value={quantity} max={stock} onChange={setQuantity} />

          {product.descripcion ? (
            <View style={styles.description}>
              <Text style={styles.descriptionTitle}>Descripción</Text>
              <Text style={styles.descriptionText}>{product.descripcion}</Text>
            </View>
          ) : null}

          {requiresVariant && !hasChosenColor && (
            <Text style={styles.selectVariantHint}>Selecciona un color antes de continuar.</Text>
          )}

          <Pressable
            style={[styles.cta, (!canAddToCart || stock <= 0) && styles.ctaDisabled]}
            disabled={!canAddToCart || stock <= 0}
            onPress={handleAddToCart}
          >
            <Ionicons name="cart-outline" size={18} color={colors.textOnPrimary} />
            <Text style={styles.ctaText}>Agregar al carrito</Text>
          </Pressable>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
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
  cta: {
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
