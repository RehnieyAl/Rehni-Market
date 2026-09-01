import type { PublicProductVariant } from "../types/response";

export interface VariantAxis {
  name: string;
  isColor: boolean;
  values: { value: string; hex: string | null }[];
}

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

export function firstLiveVariant(
  variants: PublicProductVariant[],
): PublicProductVariant | null {
  return variants[0] ?? null;
}

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
