import { ChevronLeft, Flag, ShoppingCart } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import { getPublicProductDetail } from "../api/productsService";
import ProductDetailSkeleton from "./ProductDetailSkeleton";
import ProductGallery from "./ProductGallery";
import SellerCard from "./SellerCard";
import ProductRatingBadge from "./ProductRatingBadge";
import ProductPrice from "./ProductPrice";
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

import type { PublicProductDetail } from "../types/response";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { role } = useRole();
  const canPurchase = role === null || role === "user";

  const { addItem } = useCart();
  const { showAlert } = useAlert();
  const redirectToLogin = useRedirectToLogin();
  const [addingToCart, setAddingToCart] = useState(false);

  const [reportModalOpen, setReportModalOpen] = useState(false);

  const [product, setProduct] = useState<PublicProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // { [attributeName]: value } — la selección del comprador por cada eje de variante.
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

  // La combinación elegida no corresponde a ninguna variante existente.
  const invalidCombination = allAxesChosen && activeVariant === null;

  // Primera variante viva: SOLO fuente de la imagen inicial, no se auto-selecciona
  // (`activeVariant` sigue null hasta que el usuario elige todos los ejes).
  const firstVariant = useMemo(
    () => (product ? firstLiveVariant(product.variants) : null),
    [product],
  );

  // Galería (fuente primaria -> fallbacks, nunca queda vacía):
  //  1. Variante activa (selección completa y válida) con imágenes propias.
  //  2. Selección parcial / combinación inexistente: una variante que coincida con
  //     TODOS los ejes ya elegidos y tenga imágenes (solo representación visual).
  //  3. Sin selección: imágenes de la PRIMERA VARIANTE VIVA (imagen inicial del producto).
  //  4. Fallback heredado: imágenes generales del producto padre.
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

  // Selector jerárquico por el orden de `axes`: al cambiar el eje del índice N se
  // conservan los ejes anteriores (< N), se fija el nuevo valor en N y se limpian
  // TODOS los posteriores (> N), aunque siguieran siendo combinables.
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
    if (role === null) {
      redirectToLogin();
      return;
    }
    setReportModalOpen(true);
  };

  if (loading) return <ProductDetailSkeleton />;

  if (notFound || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-lg font-medium text-gray-700">
          No encontramos este producto.
        </p>
        <Link
          to="/products"
          className="mt-4 inline-flex items-center gap-2 text-sm text-[#6D0F2D] hover:underline"
        >
          <ChevronLeft size={16} />
          Volver a productos
        </Link>
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

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
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
            <p className="text-sm font-medium uppercase tracking-wide text-[#6D0F2D]">
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
                  className="mt-1 flex shrink-0 items-center gap-1.5 text-xs font-medium text-gray-400 transition hover:text-red-600"
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

              <div className="flex w-fit items-center rounded-xl border border-gray-300">
                <button
                  type="button"
                  className="px-3.5 py-2 text-gray-600 hover:bg-gray-50"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                >
                  −
                </button>

                <span className="w-10 text-center text-sm font-medium">{quantity}</span>

                <button
                  type="button"
                  className="px-3.5 py-2 text-gray-600 hover:bg-gray-50"
                  onClick={() => setQuantity((prev) => Math.min(stock || 1, prev + 1))}
                >
                  +
                </button>
              </div>
            </div>

            <p className="mt-4 text-sm">
              {invalidCombination ? (
                <span className="font-semibold text-red-600">
                  Esa combinación no está disponible.
                </span>
              ) : requiresVariant && !allAxesChosen ? (
                anyVariantInStock ? (
                  <span className="text-gray-500">
                    Selecciona una opción para ver el stock disponible.
                  </span>
                ) : (
                  <span className="font-semibold text-red-600">Sin stock</span>
                )
              ) : stock > 0 ? (
                <>
                  <span className="text-gray-500">Stock disponible: </span>
                  <span className="font-semibold text-green-600">{stock} unidades</span>
                </>
              ) : (
                <span className="font-semibold text-red-600">Sin stock</span>
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
                    <p className="text-sm text-amber-600">
                      Selecciona todas las opciones antes de continuar.
                    </p>
                  )}

                  <button
                    onClick={() => handleAddToCart(false)}
                    disabled={addingToCart || !canAddToCart || stock <= 0}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#6D0F2D] py-3.5 font-medium text-white transition hover:bg-[#530A20] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ShoppingCart size={18} />
                    {addingToCart ? "Agregando..." : "Agregar al carrito"}
                  </button>

                  <button
                    onClick={() => handleAddToCart(true)}
                    disabled={addingToCart || !canAddToCart || stock <= 0}
                    className="rounded-xl border border-gray-300 py-3.5 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Comprar ahora
                  </button>
                </>
              ) : (
                <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-4 text-center text-sm text-gray-500">
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
