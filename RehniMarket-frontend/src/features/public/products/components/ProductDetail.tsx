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

  return (
    <div className="mx-auto w-full max-w-[clamp(1280px,90vw,1600px)] px-2 py-6 sm:px-4 sm:py-8 lg:px-8">
      <Link
        to="/products"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
      >
        <ChevronLeft size={16} />
        Volver a productos
      </Link>

      <div className="overflow-hidden rounded-card border border-gray-200 bg-white shadow-card">
        <div className="grid items-stretch lg:grid-cols-2">
          <div className="border-b border-gray-100 p-4 sm:p-6 lg:border-b-0 lg:border-r">
            <ProductGallery
              images={images}
              productName={product.name}
              selectedUrl={selectedImage}
              onSelect={setManualImage}
            />
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">
              {product.catalog_name}
            </p>

            <div className="mt-1 flex items-start justify-between gap-3">
              <h1 className="text-3xl font-bold leading-tight text-gray-900">
                {product.name}
              </h1>

              {canPurchase && (
                <button
                  type="button"
                  onClick={handleReportClick}
                  className="mt-1 flex shrink-0 items-center gap-1.5 text-xs font-medium text-gray-400 transition hover:text-danger"
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

            <div className="mt-4">
              {requiresVariant && !activeVariant && (
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
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
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Cantidad</h3>

              <div className="flex w-fit items-center overflow-hidden rounded-control border border-gray-300">
                <button
                  type="button"
                  aria-label="Disminuir cantidad"
                  className="flex h-11 w-11 items-center justify-center text-lg text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  disabled={quantity <= 1}
                >
                  −
                </button>

                <span className="w-12 text-center text-sm font-medium tabular-nums">{quantity}</span>

                <button
                  type="button"
                  aria-label="Aumentar cantidad"
                  className="flex h-11 w-11 items-center justify-center text-lg text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
                  onClick={() => setQuantity((prev) => Math.min(stock || 1, prev + 1))}
                  disabled={stock > 0 && quantity >= stock}
                >
                  +
                </button>
              </div>
            </div>

            <p className="mt-4 text-sm">
              {invalidCombination ? (
                <span className="font-semibold text-danger">
                  Esa combinación no está disponible.
                </span>
              ) : requiresVariant && !allAxesChosen ? (
                anyVariantInStock ? (
                  <span className="text-gray-500">
                    Selecciona una opción para ver el stock disponible.
                  </span>
                ) : (
                  <span className="font-semibold text-danger">Sin stock</span>
                )
              ) : stock > 0 ? (
                <>
                  <span className="text-gray-500">Stock disponible: </span>
                  <span className="font-semibold text-success">{stock} unidades</span>
                </>
              ) : (
                <span className="font-semibold text-danger">Sin stock</span>
              )}
            </p>

            {activeVariant?.sku && (
              <p className="mt-1 text-sm text-gray-500">
                SKU:{" "}
                <span className="font-medium text-gray-700">{activeVariant.sku}</span>
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

                  <Button
                    size="lg"
                    fullWidth
                    variant="outline"
                    onClick={() => handleAddToCart(true)}
                    disabled={addingToCart || !canAddToCart || stock <= 0}
                  >
                    Comprar ahora
                  </Button>
                </>
              ) : (
                <p className="rounded-control border border-dashed border-gray-300 bg-gray-50 py-4 text-center text-sm text-gray-500">
                  Las cuentas de empresa o administración no pueden realizar compras.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12">
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
