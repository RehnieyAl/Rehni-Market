/** Detalle público de producto: galería, precio por variante, vendedor, compra, pestañas, opiniones,
 * preguntas frecuentes y relacionados. Solo compradores (o visitantes, vía login) compran y guardan. */
import { ChevronLeft, Flag, Heart, PackageX, ShoppingCart } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import { getPublicProductDetail } from "../api/productsService";
import ProductDetailSkeleton from "./ProductDetailSkeleton";
import ProductGallery from "./ProductGallery";
import SellerCard from "./SellerCard";
import ProductRatingBadge from "./ProductRatingBadge";
import ProductPrice from "./ProductPrice";
import ProductTaxLine from "./ProductTaxLine";
import ProductTabs from "./ProductTabs";
import ProductTrustCards from "./ProductTrustCards";
import ProductFaq from "./ProductFaq";
import RelatedProducts from "./RelatedProducts";
import VariantAttributePicker from "./VariantAttributePicker";
import { deriveVariantAxes, firstLiveVariant, resolveVariant } from "../utils/variantAxes";
import { resolveDisplayPricing, resolveGalleryImages } from "../utils/productDisplay";
import QuantityStepper from "./QuantityStepper";
import StockStatus from "./StockStatus";
import ReviewsSection from "@/features/public/reviews/components/ReviewsSection";
import ReportModal from "@/features/reports/components/ReportModal";
import { useRole } from "@/hooks/useRole";
import { useCart } from "@/features/cart/context/useCart";
import { useFavorites } from "@/features/favorites/context/useFavorites";
import { useAlert } from "@/shared/components/alert/useAlert";
import { ErrorCode } from "@/shared/types/ErrorCode";
import { useRedirectToLogin } from "@/features/public/auth/hooks/useRedirectToLogin";
import { Button, EmptyState } from "@/shared/components/ui";
import { buttonClasses } from "@/shared/components/ui/buttonVariants";

import type { PublicProductDetail } from "../types/response";

function addToCartErrorMessage(error: unknown): string {
  const detail = axios.isAxiosError(error) ? error.response?.data?.detail : undefined;

  if (detail?.code === ErrorCode.INSUFFICIENT_STOCK) {
    return detail.message ?? "Ya tienes la cantidad máxima disponible en tu carrito.";
  }

  return detail?.message ?? "Ocurrió un error al agregar el producto al carrito.";
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { role, status } = useRole();
  const canPurchase = role === null || role === "user";

  const { addItem } = useCart();
  const { showAlert } = useAlert();
  const redirectToLogin = useRedirectToLogin();
  const [addingToCart, setAddingToCart] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const [savingFavorite, setSavingFavorite] = useState(false);

  const [reportModalOpen, setReportModalOpen] = useState(false);

  const [product, setProduct] = useState<PublicProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selected, setSelected] = useState<Record<string, string>>({});
  const [manualImage, setManualImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setNotFound(false);

        const response = await getPublicProductDetail(id);

        if (!cancelled) {
          setProduct(response);
          setSelected({});
          setQuantity(1);
          setManualImage(null);
        }
      } catch (error) {
        console.error("Error cargando el producto:", error);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const axes = useMemo(
    () => (product ? deriveVariantAxes(product.variants) : []),
    [product],
  );

  const requiresVariant = axes.length > 0;
  const allAxesChosen = axes.length > 0 && axes.every((axis) => selected[axis.name]);

  const activeVariant = useMemo(() => {
    if (!product || !allAxesChosen) return null;
    return resolveVariant(product.variants, axes, selected);
  }, [product, axes, selected, allAxesChosen]);

  const invalidCombination = allAxesChosen && activeVariant === null;

  const firstVariant = useMemo(
    () => (product ? firstLiveVariant(product.variants) : null),
    [product],
  );

  const images = useMemo(
    () => (product ? resolveGalleryImages(product, activeVariant, selected, firstVariant) : []),
    [activeVariant, product, selected, firstVariant],
  );

  const attributePairs = useMemo(() => {
    if (!product) return [];
    return product.attributes.map((pair) => ({ name: pair.attribute, value: pair.value }));
  }, [product]);

  const stock = activeVariant ? activeVariant.stock : product?.stock ?? 0;

  const anyVariantInStock = useMemo(
    () => (product?.variants ?? []).some((variant) => variant.stock > 0),
    [product],
  );

  const selectedImage = useMemo(() => {
    if (manualImage && images.some((image) => image.url === manualImage)) {
      return manualImage;
    }
    const mainImage = images.find((image) => image.is_main) ?? images[0];
    return mainImage?.url ?? null;
  }, [manualImage, images]);

  const canAddToCart = !requiresVariant || activeVariant !== null;

  const handleAxisChange = (attributeName: string, value: string) => {
    const axisIndex = axes.findIndex((axis) => axis.name === attributeName);
    const priorAxisNames = axes
      .slice(0, axisIndex < 0 ? 0 : axisIndex)
      .map((axis) => axis.name);

    setSelected((prev) => {
      const next: Record<string, string> = {};
      priorAxisNames.forEach((name) => {
        if (prev[name]) next[name] = prev[name];
      });
      next[attributeName] = value;
      return next;
    });
    setQuantity(1);
    setManualImage(null);
  };

  const handleAddToCart = async (redirectToCart: boolean) => {
    if (!product) return;

    if (status === "loading") return;

    if (role === null) {
      redirectToLogin();
      return;
    }

    if (!canAddToCart || stock <= 0) return;

    try {
      setAddingToCart(true);
      await addItem(product.id, quantity, activeVariant?.id);
      if (redirectToCart) void navigate("/cart");
    } catch (error) {
      console.error("Error agregando al carrito:", error);
      showAlert("error", addToCartErrorMessage(error));
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!product || savingFavorite || status === "loading") return;
    if (role === null) {
      redirectToLogin();
      return;
    }
    if (role !== "user") return;

    try {
      setSavingFavorite(true);
      await toggleFavorite(product.id);
    } catch (error) {
      console.error("Error actualizando favoritos:", error);
    } finally {
      setSavingFavorite(false);
    }
  };

  const handleReportClick = () => {
    if (status === "loading") return;
    if (role === null) {
      redirectToLogin();
      return;
    }
    setReportModalOpen(true);
  };

  if (loading) return <ProductDetailSkeleton />;

  if (notFound || !product) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16">
        <EmptyState
          icon={<PackageX size={22} />}
          title="No encontramos este producto"
          description="Puede que ya no esté disponible o que el enlace sea incorrecto."
          action={
            <Link to="/products" className={buttonClasses({ variant: "outline" })}>
              <ChevronLeft size={16} />
              Volver a productos
            </Link>
          }
        />
      </div>
    );
  }

  const display = resolveDisplayPricing(product, activeVariant);

  return (
    <div className="mx-auto w-full max-w-[clamp(1280px,90vw,1600px)] px-3 py-6 text-ink sm:px-4 sm:py-8 lg:px-8">
      <Link
        to="/products"
        className="mb-6 inline-flex items-center gap-2 text-sm text-ink-muted transition hover:text-ink"
      >
        <ChevronLeft size={16} />
        Volver a productos
      </Link>

      {/* overflow-clip (no hidden): recorta las esquinas sin volverse contenedor de scroll, que anularía el sticky de la galería. */}
      <div className="overflow-clip rounded-card border border-hairline bg-surface-1 shadow-pop">
        <div className="grid items-stretch lg:grid-cols-2">
          <div className="min-w-0 border-b border-hairline p-4 sm:p-6 lg:border-b-0 lg:border-r">
            {/* La columna de compra es más alta: la galería acompaña el scroll en vez de dejar un hueco. */}
            <div className="lg:sticky lg:top-28">
              <ProductGallery
                images={images}
                productName={product.name}
                selectedUrl={selectedImage}
                onSelect={setManualImage}
              />
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            <p className="text-sm font-medium text-ink-muted">
              {product.catalog_name}
            </p>

            <div className="mt-1 flex items-start justify-between gap-3">
              <h1 className="text-3xl font-semibold leading-tight text-ink">
                {product.name}
              </h1>

              {canPurchase && (
                <button
                  type="button"
                  onClick={handleReportClick}
                  className="mt-1 flex shrink-0 items-center gap-1.5 text-xs font-medium text-ink-muted transition hover:text-danger"
                  title="Reportar producto"
                >
                  <Flag size={14} />
                  Reportar
                </button>
              )}
            </div>

            <ProductRatingBadge
              averageRating={product.average_rating}
              reviewCount={product.review_count}
            />

            <div className="mt-4 rounded-card border border-hairline bg-surface-2 p-4">
              {requiresVariant && !activeVariant && (
                <p className="text-xs font-medium text-ink-muted">
                  Desde
                </p>
              )}
              <ProductPrice
                price={display.price}
                discountEnabled={display.discountEnabled}
                discountPercentage={display.discountPercentage}
                finalPrice={display.finalPrice}
              />

              <ProductTaxLine
                appliesTax={product.applies_tax}
                taxRate={product.tax_rate}
                taxAmount={display.taxAmount}
                priceWithTax={display.priceWithTax}
              />
            </div>

            <SellerCard
              companyId={product.company_id}
              companyName={product.company_name}
              companyLogo={product.company_logo}
              isVerified={product.company_is_verified}
            />

            {axes.length > 0 && (
              <div className="mt-6">
                <VariantAttributePicker
                  variants={product.variants}
                  selected={selected}
                  onChange={handleAxisChange}
                />
              </div>
            )}

            <QuantityStepper quantity={quantity} stock={stock} onChange={setQuantity} />

            <StockStatus
              stock={stock}
              invalidCombination={invalidCombination}
              pendingSelection={requiresVariant && !allAxesChosen}
              anyVariantInStock={anyVariantInStock}
            />

            {activeVariant?.sku && (
              <p className="mt-1 text-sm text-ink-muted">
                SKU:{" "}
                <span className="font-medium text-ink">{activeVariant.sku}</span>
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3">
              {canPurchase ? (
                <>
                  {requiresVariant && !allAxesChosen && (
                    <p className="text-sm text-warning">
                      Selecciona todas las opciones antes de continuar.
                    </p>
                  )}

                  <div className="flex flex-col gap-3 min-[420px]:flex-row">
                    <Button
                      size="lg"
                      className="min-[420px]:flex-1"
                      loading={addingToCart}
                      onClick={() => handleAddToCart(false)}
                      disabled={!canAddToCart || stock <= 0}
                      leadingIcon={<ShoppingCart size={18} />}
                    >
                      {addingToCart ? "Agregando…" : "Agregar al carrito"}
                    </Button>

                    <button
                      type="button"
                      onClick={handleToggleFavorite}
                      disabled={savingFavorite}
                      aria-pressed={isFavorite(product.id)}
                      className="flex h-12 items-center justify-center gap-2 rounded-control border border-white/20 px-6 text-sm font-medium text-ink transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary disabled:opacity-60"
                    >
                      <Heart
                        size={18}
                        aria-hidden="true"
                        className={isFavorite(product.id) ? "fill-secondary text-secondary" : undefined}
                      />
                      Guardar
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddToCart(true)}
                    disabled={addingToCart || !canAddToCart || stock <= 0}
                    className="flex h-12 w-full items-center justify-center rounded-control border border-white/20 text-sm font-medium text-ink transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Comprar ahora
                  </button>
                </>
              ) : (
                <p className="rounded-control border border-dashed border-white/15 bg-surface-2 py-4 text-center text-sm text-ink-muted">
                  Las cuentas de empresa o administración no pueden realizar compras.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <ProductTrustCards isVerified={product.company_is_verified} />

      <div className="mt-10">
        <ProductTabs
          description={product.descripcion}
          attributes={attributePairs}
          reviewCount={product.review_count}
        />
      </div>

      <section className="mt-8">
        <ReviewsSection
          productId={product.id}
          averageRating={product.average_rating}
          reviewCount={product.review_count}
          distribution={product.rating_distribution}
        />
      </section>

      <ProductFaq />

      <RelatedProducts catalogId={product.catalog_id} excludeProductId={product.id} />

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetType="product"
        targetId={product.id}
        targetLabel={product.name}
      />
    </div>
  );
}
