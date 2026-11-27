/** Qué muestra el detalle de producto según la variante elegida: precios (con IVA) e imágenes de la galería. */
import type { PublicProductDetail, PublicProductImage, PublicProductVariant } from "../types/response";

export interface DisplayPricing {
  price: string;
  finalPrice: string;
  discountEnabled: boolean;
  discountPercentage: number | null;
  taxAmount: string;
  priceWithTax: string;
}

/** La variante resuelta manda; sin ella, los campos "Desde" del producto (la variante viva más barata). */
export function resolveDisplayPricing(
  product: PublicProductDetail,
  variant: PublicProductVariant | null,
): DisplayPricing {
  if (variant) {
    return {
      price: variant.price,
      finalPrice: variant.final_price,
      discountEnabled: variant.discount_enabled,
      discountPercentage: variant.discount_percentage,
      taxAmount: variant.tax_amount,
      priceWithTax: variant.final_price_with_tax,
    };
  }

  return {
    price: product.price,
    finalPrice: product.final_price,
    discountEnabled: product.discount_enabled,
    discountPercentage: product.discount_percentage,
    taxAmount: product.tax_amount,
    priceWithTax: product.price_with_tax,
  };
}

function matchesChosenOptions(variant: PublicProductVariant, chosen: [string, string][]): boolean {
  const optionValues = Object.fromEntries(variant.options.map((option) => [option.attribute, option.value]));
  return chosen.every(([name, value]) => optionValues[name] === value);
}

/**
 * Imágenes de la galería en orden de preferencia: las de la variante resuelta, las de una variante que
 * coincida con lo elegido hasta ahora (p. ej. solo el color), las de la primera variante viva y,
 * por último, las del producto.
 */
export function resolveGalleryImages(
  product: PublicProductDetail,
  variant: PublicProductVariant | null,
  selected: Record<string, string>,
  firstVariant: PublicProductVariant | null,
): PublicProductImage[] {
  if (variant && variant.images.length > 0) return variant.images;

  const chosen = Object.entries(selected).filter(([, value]) => value);
  if (chosen.length > 0) {
    const representative = product.variants.find(
      (candidate) => candidate.images.length > 0 && matchesChosenOptions(candidate, chosen),
    );
    if (representative) return representative.images;
  }

  if (firstVariant && firstVariant.images.length > 0) return firstVariant.images;

  return product.images ?? [];
}
