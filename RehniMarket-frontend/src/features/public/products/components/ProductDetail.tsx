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
import ReviewsSection from "@/features/public/reviews/components/ReviewsSection";
import ReportModal from "@/features/reports/components/ReportModal";
import { useRole } from "@/hooks/useRole";
import { useCart } from "@/features/cart/context/useCart";
import { useAlert } from "@/shared/components/alert/useAlert";
import { ErrorCode } from "@/shared/types/ErrorCode";
import { useRedirectToLogin } from "@/features/public/auth/hooks/useRedirectToLogin";

import type { PublicProductDetail, PublicProductVariant } from "../types/response";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Solo el rol USER puede comprar; un visitante sin sesión sí ve el botón (puede registrarse).
  const { role } = useRole();
  const canPurchase = role === null || role === "user";

  const { addItem } = useCart();
  const { showAlert } = useAlert();
  const redirectToLogin = useRedirectToLogin();
  const [addingToCart, setAddingToCart] = useState(false);

  // "Reportar producto": reutiliza ReportModal. Solo el rol USER; sin sesión va a login.
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const [product, setProduct] = useState<PublicProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Variante activa; null = datos base del producto.
  const [activeVariant, setActiveVariant] = useState<PublicProductVariant | null>(null);

  // Distingue "aún no elegí color" de "elegí la opción base"; ambos dejan activeVariant en null.
  const [hasChosenColor, setHasChosenColor] = useState(false);

  // Miniatura elegida a mano; si es null o ya no está en la galería activa, se usa la principal.
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
          setActiveVariant(null);
          setHasChosenColor(false);
          setQuantity(1);
          setManualImage(null);
        }
      } catch (error) {
        console.error("Error cargando el producto:", error);

        if (!cancelled) {
          setNotFound(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Datos en pantalla: los de la variante elegida o, por defecto, los del producto base.
  const images = useMemo(
    () => (activeVariant ? activeVariant.images : product?.images ?? []),
    [activeVariant, product],
  );

  const specifications = activeVariant
    ? activeVariant.specifications
    : product?.specifications ?? [];

  const stock = activeVariant ? activeVariant.stock : product?.stock ?? 0;

  // Cada variante tiene su propio descuento, independiente del producto base.
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

  // Colores seleccionables: base + variantes con color. Las agotadas se marcan outOfStock, no se ocultan.
  const colorOptions = useMemo(() => {
    if (!product) return [];

    const options: {
      key: string;
      variant: PublicProductVariant | null;
      hex: string;
      name: string;
      outOfStock: boolean;
    }[] = [];

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

  // Antes de elegir color, `stock` es el del producto base (puede ser 0 aunque
  // haya variantes con stock); solo se usa para el mensaje de stock inicial.
  const anyVariantInStock = colorOptions.some((option) => !option.outOfStock);

  // Nombre del color activo para "Color: X"; solo tras una elección explícita (incluida la swatch base).
  const selectedColorName = hasChosenColor
    ? (activeVariant?.color?.name ?? product?.color?.name ?? null)
    : null;

  const selectedImage = useMemo(() => {
    if (manualImage && images.some((image) => image.url === manualImage)) {
      return manualImage;
    }

    const mainImage = images.find((image) => image.is_main) ?? images[0];

    return mainImage?.url ?? null;
  }, [manualImage, images]);

  // Con variantes, elegir color = elegir variante.
  const requiresVariant = (product?.variants.length ?? 0) > 0;
  // hasChosenColor (no activeVariant !== null): la swatch base también habilita la compra.
  const canAddToCart = !requiresVariant || hasChosenColor;

  const handleAddToCart = async (redirectToCart: boolean) => {
    if (!product) return;

    if (role === null) {
      // Conserva /products/:id como destino de retorno tras el login.
      redirectToLogin();
      return;
    }

    if (!canAddToCart) return;

    // Guardia defensiva: los botones ya se deshabilitan con stock <= 0.
    if (stock <= 0) return;

    try {
      setAddingToCart(true);

      await addItem(product.id, quantity, activeVariant?.id);

      if (redirectToCart) {
        navigate("/cart");
      }
    } catch (error) {
      console.error("Error agregando al carrito:", error);

      const detail = axios.isAxiosError(error) ? error.response?.data?.detail : undefined;

      // INSUFFICIENT_STOCK: si la cantidad pedida iguala lo que ya hay en el carrito,
      // el mensaje del backend puede confundir.
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

  if (loading) {
    return <ProductDetailSkeleton />;
  }

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

            <div className="mt-6 flex flex-wrap items-start justify-between gap-6">
              {colorOptions.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">
                    Color{selectedColorName ? `: ${selectedColorName}` : ""}
                  </h3>

                  <div className="flex flex-wrap gap-3">
                    {colorOptions.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        title={option.outOfStock ? `${option.name} (Sin stock)` : option.name}
                        disabled={option.outOfStock}
                        onClick={() => {
                          if (option.outOfStock) return;

                          setActiveVariant(option.variant);
                          setHasChosenColor(true);
                          setQuantity(1);
                          setManualImage(null);
                        }}
                        className={`h-9 w-9 rounded-full border-2 transition ${
                          option.outOfStock
                            ? "cursor-not-allowed border-gray-200 opacity-40"
                            : (activeVariant?.id ?? "base") === option.key
                              ? "border-[#6D0F2D]"
                              : "border-gray-300 hover:border-gray-400"
                        }`}
                        style={{ backgroundColor: option.hex }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
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
            </div>

            <p className="mt-4 text-sm">
              {requiresVariant && !hasChosenColor ? (
                anyVariantInStock ? (
                  <span className="text-gray-500">
                    Selecciona un color para ver el stock disponible.
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

            <div className="mt-6 flex flex-col gap-3">
              {canPurchase ? (
                <>
                  {requiresVariant && !hasChosenColor && (
                    <p className="text-sm text-amber-600">
                      Selecciona un color antes de continuar.
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
          specifications={specifications}
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
