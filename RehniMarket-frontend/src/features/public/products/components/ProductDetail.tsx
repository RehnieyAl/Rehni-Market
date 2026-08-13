import { ChevronLeft, ImageOff } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { getPublicProductDetail } from "../api/productsService";
import ProductDetailSkeleton from "./ProductDetailSkeleton";
import { formatPrice } from "@/shared/utils/formatPrice";

import type { PublicProductDetail, PublicProductVariant } from "../types/response";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();

  const [product, setProduct] = useState<PublicProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Variante activa (colores/imágenes/precio propios). `null` = datos
  // base del producto (ver ALCANCE > variantes en publicService/Products.py).
  const [activeVariant, setActiveVariant] = useState<PublicProductVariant | null>(null);

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
  const colorOptions = useMemo(() => {
    if (!product) return [];

    const options: { key: string; variant: PublicProductVariant | null; hex: string; name: string }[] = [];

    if (product.color) {
      options.push({ key: "base", variant: null, hex: product.color.hex_color, name: product.color.name });
    }

    for (const variant of product.variants) {
      if (variant.color) {
        options.push({ key: variant.id, variant, hex: variant.color.hex_color, name: variant.color.name });
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

          <p className="mt-2 text-sm text-gray-500">
            Vendido por {product.company_name}
          </p>

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

              <div className="flex gap-3">
                {colorOptions.map((option) => (
                  <button
                    key={option.key}
                    title={option.name}
                    onClick={() => {
                      setActiveVariant(option.variant);
                      setQuantity(1);
                    }}
                    className={`h-10 w-10 rounded-full border-2 ${
                      (activeVariant?.id ?? "base") === option.key
                        ? "border-[#6D0F2D]"
                        : "border-gray-300"
                    }`}
                    style={{ backgroundColor: option.hex }}
                  />
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

            <p className="mt-2 text-sm text-green-600">
              {stock} unidades disponibles
            </p>
          </div>

          {/* BOTONES */}
          <div className="mt-8 flex flex-col gap-3">
            {/* TODO(backend): no existe todavía un servicio de carrito/compra
                (no hay CartService/OrderService en el proyecto) - se deja el
                botón tal como estaba en el diseño original, sin acción, hasta
                que ese endpoint exista. */}
            <button className="rounded-xl bg-[#6D0F2D] py-4 font-medium text-white">
              Agregar al carrito
            </button>

            <button className="rounded-xl border py-4 font-medium">
              Comprar ahora
            </button>
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
    </div>
  );
}
