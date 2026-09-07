import { ChevronLeft, Flag, PackageX, ShoppingCart } from "lucide-react";
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
import ReviewsSection from "@/features/public/reviews/components/ReviewsSection";
import ReportModal from "@/features/reports/components/ReportModal";
import { useRole } from "@/hooks/useRole";
import { useCart } from "@/features/cart/context/useCart";
import { useAlert } from "@/shared/components/alert/useAlert";
import { ErrorCode } from "@/shared/types/ErrorCode";
import { useRedirectToLogin } from "@/features/public/auth/hooks/useRedirectToLogin";
import { Button, EmptyState } from "@/shared/components/ui";
import { buttonClasses } from "@/shared/components/ui/buttonVariants";

import type { PublicProductDetail } from "../types/response";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { role, status } = useRole();
  const canPurchase = role === null || role === "user";

  const { addItem } = useCart();
  const { showAlert } = useAlert();
  const redirectToLogin = useRedirectToLogin();
  const [addingToCart, setAddingToCart] = useState(false);

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

    load();

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

  const images = useMemo(() => {
    if (!product) return [];

    if (activeVariant && activeVariant.images.length > 0) {
      return activeVariant.images;
    }

    const chosen = Object.entries(selected).filter(([, value]) => value);
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

    if (firstVariant && firstVariant.images.length > 0) {
      return firstVariant.images;
    }

    return product.images ?? [];
  }, [activeVariant, product, selected, firstVariant]);

  const attributePairs = useMemo(() => {
    if (!product) return [];
    return product.attributes.map((pair) => ({ name: pair.attribute, value: pair.value }));
  }, [product]);

  const stock = activeVariant ? activeVariant.stock : product?.stock ?? 0;
  const displayPrice = activeVariant ? activeVariant.price : product?.price ?? "0";
  const displayFinalPrice = activeVariant
    ? activeVariant.final_price
    : product?.final_price ?? "0";
  const discountEnabled = activeVariant
    ? activeVariant.discount_enabled
    : product?.discount_enabled ?? false;
  const discountPercentage = activeVariant
    ? activeVariant.discount_percentage
    : product?.discount_percentage ?? null;
  const displayTaxAmount = activeVariant
    ? activeVariant.tax_amount
    : product?.tax_amount ?? "0";
  const displayPriceWithTax = activeVariant
    ? activeVariant.final_price_with_tax
    : product?.price_with_tax ?? "0";

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
      if (redirectToCart) navigate("/cart");
    } catch (error) {
      console.error("Error agregando al carrito:", error);

      const detail = axios.isAxiosError(error) ? error.response?.data?.detail : undefined;
      const message =
        detail?.code === ErrorCode.INSUFFICIENT_STOCK
          ? (detail?.message ?? "Ya tienes la cantidad máxima disponible en tu carrito.")
          : detail?.message;

      showAlert("error", message ?? "Ocurrió un error al agregar el producto al carrito.");
    } finally {
      setAddingToCart(false);
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
      <div className="theme-dark mx-auto w-full max-w-2xl px-4 py-16">
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

  return (
    <div className="theme-dark mx-auto w-full max-w-[clamp(1280px,90vw,1600px)] px-2 py-6 text-ink sm:px-4 sm:py-8 lg:px-8">
      <Link
        to="/products"
        className="mb-6 inline-flex items-center gap-2 text-sm text-ink-muted transition hover:text-ink"
      >
        <ChevronLeft size={16} />
        Volver a productos
      </Link>

      <div className="overflow-hidden rounded-card border border-hairline bg-surface-1 shadow-pop">
        <div className="grid items-stretch lg:grid-cols-2">
          <div className="border-b border-hairline p-4 sm:p-6 lg:border-b-0 lg:border-r">
            <ProductGallery
              images={images}
              productName={product.name}
              selectedUrl={selectedImage}
              onSelect={setManualImage}
            />
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            <p className="text-sm font-medium uppercase tracking-wide text-brand-400">
              {product.catalog_name}
            </p>

            <div className="mt-1 flex items-start justify-between gap-3">
              <h1 className="text-3xl font-bold leading-tight text-ink">
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
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                  Desde
                </p>
              )}
              <ProductPrice
                price={displayPrice}
                discountEnabled={discountEnabled}
                discountPercentage={discountPercentage}
                finalPrice={displayFinalPrice}
              />

              <ProductTaxLine
                appliesTax={product.applies_tax}
                taxRate={product.tax_rate}
                taxAmount={displayTaxAmount}
                priceWithTax={displayPriceWithTax}
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

            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold text-ink">Cantidad</h3>

              <div className="flex w-fit items-center overflow-hidden rounded-control border border-hairline bg-surface-2">
                <button
                  type="button"
                  aria-label="Disminuir cantidad"
                  className="flex h-11 w-11 items-center justify-center text-lg text-ink-muted transition hover:bg-white/5 hover:text-ink disabled:opacity-40"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  disabled={quantity <= 1}
                >
                  −
                </button>

                <span className="w-12 text-center text-sm font-medium tabular-nums text-ink">
                  {quantity}
                </span>

                <button
                  type="button"
                  aria-label="Aumentar cantidad"
                  className="flex h-11 w-11 items-center justify-center text-lg text-ink-muted transition hover:bg-white/5 hover:text-ink disabled:opacity-40"
                  onClick={() => setQuantity((prev) => Math.min(stock || 1, prev + 1))}
                  disabled={stock > 0 && quantity >= stock}
                >
                  +
                </button>
              </div>
            </div>

            <p className="mt-4 flex items-center gap-2 text-sm">
              {invalidCombination ? (
                <span className="font-semibold text-danger">
                  Esa combinación no está disponible.
                </span>
              ) : requiresVariant && !allAxesChosen ? (
                anyVariantInStock ? (
                  <span className="text-ink-muted">
                    Selecciona una opción para ver el stock disponible.
                  </span>
                ) : (
                  <span className="font-semibold text-danger">Sin stock</span>
                )
              ) : stock > 0 ? (
                <>
                  <span className="h-2 w-2 shrink-0 rounded-full bg-stock" />
                  <span className="text-ink-muted">En stock · </span>
                  <span className="font-semibold text-stock">{stock} unidades disponibles</span>
                </>
              ) : (
                <span className="font-semibold text-danger">Sin stock</span>
              )}
            </p>

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

                  <Button
                    size="lg"
                    fullWidth
                    loading={addingToCart}
                    onClick={() => handleAddToCart(false)}
                    disabled={!canAddToCart || stock <= 0}
                    leadingIcon={<ShoppingCart size={18} />}
                  >
                    {addingToCart ? "Agregando…" : "Agregar al carrito"}
                  </Button>

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
