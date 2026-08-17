import { ChevronLeft, ImageOff, Store } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import { getPublicProductDetail } from "../api/productsService";
import ProductDetailSkeleton from "./ProductDetailSkeleton";
import ReviewsSection from "@/features/public/reviews/components/ReviewsSection";
import { formatPrice } from "@/shared/utils/formatPrice";
import { useRole } from "@/hooks/useRole";
import { useCart } from "@/features/cart/context/useCart";
import { useAlert } from "@/shared/components/alert/useAlert";
import { ErrorCode } from "@/shared/types/ErrorCode";

import type { PublicProductDetail, PublicProductVariant } from "../types/response";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Regla de negocio: solo el rol USER puede comprar. Company/Admin/Owner
  // pueden ver el catálogo (por eso este detalle sigue siendo público
  // para ellos) pero no deben ver una acción de compra (ver ALCANCE >
  // Restricciones de compra). Un visitante sin sesión (role === null)
  // todavía puede convertirse en comprador, así que sí ve el botón.
  const { role } = useRole();
  const canPurchase = role === null || role === "user";

  const { addItem } = useCart();
  const { showAlert } = useAlert();
  const [addingToCart, setAddingToCart] = useState(false);

  const [product, setProduct] = useState<PublicProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Variante activa (colores/imágenes/precio propios). `null` = datos
  // base del producto (ver ALCANCE > variantes en publicService/Products.py).
  const [activeVariant, setActiveVariant] = useState<PublicProductVariant | null>(null);

  // `activeVariant === null` significa dos cosas distintas: "todavía no
  // elegí color" y "elegí explícitamente la opción base" (la swatch
  // "base" también deja `activeVariant` en null - ver colorOptions más
  // abajo). Sin esta bandera aparte, un producto que tiene color base
  // propio Y al menos una variante real nunca podía comprarse en su
  // versión base: `canAddToCart` exigía `activeVariant !== null`, algo
  // que seleccionar "base" nunca cumple (bug diagnosticado: producto con
  // variantes bloqueaba la compra de su configuración base).
  const [hasChosenColor, setHasChosenColor] = useState(false);

  // Imagen elegida manualmente (click en una miniatura). Si es `null`, o
  // ya no pertenece a la galería activa (p. ej. tras cambiar de variante),
  // se usa la imagen principal como valor derivado - evita depender de un
  // efecto para sincronizar este estado con `images`.
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

  // Datos "en pantalla": los de la variante seleccionada o, por defecto,
  // los del producto base. Cada variante trae su propio descuento
  // calculado (discount_enabled/final_price) - ver
  // PublicProductVariantResponse.
  const images = useMemo(
    () => (activeVariant ? activeVariant.images : product?.images ?? []),
    [activeVariant, product],
  );

  const specifications = activeVariant
    ? activeVariant.specifications
    : product?.specifications ?? [];

  const stock = activeVariant ? activeVariant.stock : product?.stock ?? 0;

  // Cada variante tiene su propio descuento, independiente del producto
  // base (ver ModelVariant.py > discount_enable/discount_value).
  const displayPrice = activeVariant ? activeVariant.price : product?.price ?? "0";

  const displayFinalPrice = activeVariant
    ? activeVariant.final_price
    : product?.final_price ?? "0";

  const discountEnabled = activeVariant
    ? activeVariant.discount_enabled
    : product?.discount_enabled ?? false;

  // Colores seleccionables: producto base + variantes con color propio.
  // Las variantes agotadas se incluyen igual (NO se ocultan - ver ALCANCE
  // > CASO 3): se marcan con `outOfStock` para mostrarlas deshabilitadas
  // con la etiqueta "Sin stock", en vez de quitarlas de la lista.
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

  const selectedImage = useMemo(() => {
    if (manualImage && images.some((image) => image.url === manualImage)) {
      return manualImage;
    }

    const mainImage = images.find((image) => image.is_main) ?? images[0];

    return mainImage?.url ?? null;
  }, [manualImage, images]);

  // Si el producto tiene variantes, cada una tiene exactamente un color
  // (regla de negocio del backend - ver CreateVariantRequest), así que
  // "seleccionar un color" y "seleccionar una variante" son lo mismo acá.
  const requiresVariant = (product?.variants.length ?? 0) > 0;
  // `hasChosenColor` (no `activeVariant !== null`): elegir la swatch
  // "base" también deja `activeVariant` en null, y debe habilitar la
  // compra igual que elegir cualquier otra variante (ver diagnóstico del
  // bug de "producto con variantes bloquea su propia compra base").
  const canAddToCart = !requiresVariant || hasChosenColor;

  const handleAddToCart = async (redirectToCart: boolean) => {
    if (!product) return;

    if (role === null) {
      navigate("/login");
      return;
    }

    if (!canAddToCart) return;

    // Guardia defensiva: los botones ya se deshabilitan con `stock <= 0`
    // (ver BOTONES más abajo), pero se repite acá por si el estado cambia
    // entre el render y el click (mismo patrón de guardias redundantes que
    // `_require_buyer` en el backend).
    if (stock <= 0) return;

    try {
      setAddingToCart(true);

      await addItem(product.id, quantity, activeVariant?.id);

      if (redirectToCart) {
        navigate("/cart");
      }
    } catch (error) {
      console.error("Error agregando al carrito:", error);

      // Se muestra el mensaje real que devuelve la API (ej. "Solo hay 1
      // unidades disponibles.") en vez de uno genérico que hacía parecer
      // un error transitorio cuando en realidad no lo era (reintentar
      // siempre fallaba igual). Usa el mismo componente global de
      // alertas que ya consume el resto del proyecto (AlertMessage vía
      // useAlert) - nunca alert()/confirm() del navegador. Cubre
      // cualquier código de error (401/403/404/409/500): siempre que la
      // API responda con detail.message, es lo que se muestra.
      const detail = axios.isAxiosError(error) ? error.response?.data?.detail : undefined;

      // Caso puntual INSUFFICIENT_STOCK: el mensaje del backend
      // ("Solo hay N unidades disponibles.") ya es correcto y se muestra
      // tal cual, pero cuando la cantidad solicitada coincide con lo que
      // ya está en el carrito (N disponibles == N ya en el carrito) ese
      // mensaje puede leerse como "no hay nada disponible" aunque sí lo
      // hay, ya en el carrito. Se aclara con una frase adicional en vez
      // de inventar un mensaje genérico tipo "Intenta nuevamente" (el
      // problema no es temporal - ver ALCANCE > MEJORA UX ADICIONAL).
      const message =
        detail?.code === ErrorCode.INSUFFICIENT_STOCK
          ? (detail?.message ?? "Ya tienes la cantidad máxima disponible en tu carrito.")
          : detail?.message;

      showAlert("error", message ?? "Ocurrió un error al agregar el producto al carrito.");
    } finally {
      setAddingToCart(false);
    }
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
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        to="/products"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
      >
        <ChevronLeft size={16} />
        Volver a productos
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* GALERÍA */}
        <div>
          <div className="overflow-hidden rounded-3xl border bg-white">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center bg-gray-100 text-gray-300">
                <ImageOff size={48} />
              </div>
            )}
          </div>

          {images.length > 0 && (
            <div className="mt-4 flex gap-3 overflow-auto">
              {images.map((image) => (
                <button
                  key={image.id}
                  onClick={() => setManualImage(image.url)}
                  className="overflow-hidden rounded-xl border"
                >
                  <img
                    src={image.url}
                    alt=""
                    className="h-20 w-20 object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* INFORMACIÓN */}
        <div>
          <span className="text-sm text-gray-500">
            {product.catalog_name}
          </span>

          <h1 className="mt-2 text-3xl font-bold">
            {product.name}
          </h1>

          {/* VENDIDO POR */}
          <Link
            to={`/company/${product.company_id}`}
            className="mt-4 flex items-center gap-3 rounded-2xl border bg-white p-4 transition hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
              {product.company_logo ? (
                <img
                  src={product.company_logo}
                  alt={product.company_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Store size={20} className="text-gray-400" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500">Vendido por</p>

              <p className="truncate font-semibold text-gray-900">
                {product.company_name}
              </p>
            </div>

            <span className="shrink-0 text-sm font-medium text-[#6D0F2D] hover:underline">
              Ver perfil de empresa
            </span>
          </Link>

          <div className="mt-6">
            {discountEnabled && (
              <p className="text-lg text-gray-400 line-through">
                {formatPrice(displayPrice)}
              </p>
            )}

            <p className="text-4xl font-bold text-[#6D0F2D]">
              {formatPrice(discountEnabled ? displayFinalPrice : displayPrice)}
            </p>
          </div>

          {/* COLORES */}
          {colorOptions.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-3 font-semibold">
                Colores disponibles
              </h3>

              <div className="flex flex-wrap gap-4">
                {colorOptions.map((option) => (
                  <div key={option.key} className="flex flex-col items-center gap-1.5">
                    <button
                      type="button"
                      title={option.outOfStock ? `${option.name} (Sin stock)` : option.name}
                      disabled={option.outOfStock}
                      onClick={() => {
                        if (option.outOfStock) return;

                        setActiveVariant(option.variant);
                        setHasChosenColor(true);
                        setQuantity(1);
                      }}
                      className={`h-10 w-10 rounded-full border-2 transition ${
                        option.outOfStock
                          ? "cursor-not-allowed border-gray-200 opacity-40"
                          : (activeVariant?.id ?? "base") === option.key
                            ? "border-[#6D0F2D]"
                            : "border-gray-300"
                      }`}
                      style={{ backgroundColor: option.hex }}
                    />

                    <span
                      className={`text-xs ${
                        option.outOfStock ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {option.name}
                      {option.outOfStock && " (Sin stock)"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CANTIDAD */}
          <div className="mt-8">
            <h3 className="mb-3 font-semibold">
              Cantidad
            </h3>

            <div className="flex w-fit items-center rounded-xl border">
              <button
                className="px-4 py-2"
                onClick={() =>
                  setQuantity((prev) => Math.max(1, prev - 1))
                }
              >
                -
              </button>

              <span className="px-6 py-2">
                {quantity}
              </span>

              <button
                className="px-4 py-2"
                onClick={() =>
                  setQuantity((prev) => Math.min(stock || 1, prev + 1))
                }
              >
                +
              </button>
            </div>

            {stock > 0 ? (
              <p className="mt-2 text-sm text-green-600">
                {stock} unidades disponibles
              </p>
            ) : (
              <p className="mt-2 text-sm font-medium text-red-600">
                Sin stock
              </p>
            )}
          </div>

          {/* BOTONES */}
          <div className="mt-8 flex flex-col gap-3">
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
                  className="rounded-xl bg-[#6D0F2D] py-4 font-medium text-white transition hover:bg-[#530A20] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addingToCart ? "Agregando..." : "Agregar al carrito"}
                </button>

                <button
                  onClick={() => handleAddToCart(true)}
                  disabled={addingToCart || !canAddToCart || stock <= 0}
                  className="rounded-xl border py-4 font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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

      {/* DESCRIPCIÓN */}
      <section className="mt-16">
        <h2 className="mb-4 text-2xl font-bold">
          Descripción
        </h2>

        <p className="leading-7 text-gray-600">
          {product.descripcion}
        </p>
      </section>

      {/* ESPECIFICACIONES */}
      {specifications.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-bold">
            Especificaciones
          </h2>

          <div className="overflow-hidden rounded-2xl border">
            {specifications.map((spec, index) => (
              <div
                key={index}
                className="flex justify-between border-b p-4 last:border-b-0"
              >
                <span className="font-medium">
                  {spec.name}
                </span>

                <span className="text-gray-600">
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* RESEÑAS */}
      <ReviewsSection productId={product.id} />
    </div>
  );
}
