import type { PublicProductVariant } from "../types/response";

export interface VariantAxis {
  name: string;
  isColor: boolean;
  values: { value: string; hex: string | null }[];
}

// Deriva los ejes de las opciones de las variantes: no asume Color/Talla ni ningún atributo concreto.
export function deriveVariantAxes(variants: PublicProductVariant[]): VariantAxis[] {
  const order: string[] = [];
  const byName = new Map<string, Map<string, string | null>>();

  for (const variant of variants) {
    for (const option of variant.options) {
      if (!byName.has(option.attribute)) {
        byName.set(option.attribute, new Map());
        order.push(option.attribute);
      }
      const values = byName.get(option.attribute)!;
      if (!values.has(option.value)) values.set(option.value, option.hex_color);
    }
  }

  return order.map((name) => {
    const values = byName.get(name)!;
    const isColor = [...values.values()].some((hex) => hex != null);
    return {
      name,
      isColor,
      values: [...values.entries()].map(([value, hex]) => ({ value, hex })),
    };
  });
}

// Primera variante viva del producto, en el orden natural en que llega del backend
// (`product_variants` no tiene columna de orden; el detalle público ya las entrega
// filtradas a las vivas). Solo se usa para la imagen inicial / representación visual:
// NO es la variante seleccionada por el usuario (`activeVariant`).
export function firstLiveVariant(
  variants: PublicProductVariant[],
): PublicProductVariant | null {
  return variants[0] ?? null;
}

// Variante viva cuya combinación de opciones coincide exactamente con `selected` (todos los ejes elegidos).
export function resolveVariant(
  variants: PublicProductVariant[],
  axes: VariantAxis[],
  selected: Record<string, string>,
): PublicProductVariant | null {
  if (axes.length === 0 || axes.some((axis) => !selected[axis.name])) return null;

  return (
    variants.find((variant) => {
      const map = Object.fromEntries(
        variant.options.map((option) => [option.attribute, option.value]),
      );
      return axes.every((axis) => map[axis.name] === selected[axis.name]);
    }) ?? null
  );
}
