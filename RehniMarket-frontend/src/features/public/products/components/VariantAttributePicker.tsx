/** Selector de variantes del detalle: un grupo de opciones por eje (color, talla…) con su disponibilidad. */
import { useMemo } from "react";

import type { PublicProductVariant } from "../types/response";
import { deriveVariantAxes } from "../utils/variantAxes";

interface VariantAttributePickerProps {
  variants: PublicProductVariant[];
  selected: Record<string, string>;
  onChange: (attributeName: string, value: string) => void;
}

export default function VariantAttributePicker({
  variants,
  selected,
  onChange,
}: VariantAttributePickerProps) {
  const axes = useMemo(() => deriveVariantAxes(variants), [variants]);

  if (axes.length === 0) return null;

  const isAvailable = (axisName: string, value: string): boolean => {
    const axisIndex = axes.findIndex((axis) => axis.name === axisName);
    const priorSelections = axes
      .slice(0, axisIndex < 0 ? 0 : axisIndex)
      .map((axis) => [axis.name, selected[axis.name]] as const)
      .filter(([, chosen]) => chosen);

    return variants.some((variant) => {
      if (variant.stock <= 0) return false;
      const optionValues = Object.fromEntries(
        variant.options.map((option) => [option.attribute, option.value]),
      );
      if (optionValues[axisName] !== value) return false;
      return priorSelections.every(([name, chosen]) => optionValues[name] === chosen);
    });
  };

  return (
    <>
      {axes.map((axis) => {
        const chosen = selected[axis.name];
        const labelId = `variant-axis-${axis.name.replace(/\s+/g, "-").toLowerCase()}`;

        return (
          <div key={axis.name} role="group" aria-labelledby={labelId} className="min-w-0">
            <p id={labelId} className="mb-2 text-sm font-semibold text-ink">
              {axis.name}
              {chosen ? `: ${chosen}` : ""}
            </p>

            <div className="flex flex-wrap gap-2">
              {axis.values.map(({ value, hex }) => {
                const available = isAvailable(axis.name, value);
                const isSelected = chosen === value;
                const unavailableHint = `${value} (no disponible con la selección actual)`;

                if (axis.isColor) {
                  return (
                    <button
                      key={value}
                      type="button"
                      title={available ? value : unavailableHint}
                      aria-label={available ? value : unavailableHint}
                      aria-pressed={isSelected}
                      disabled={!available}
                      onClick={() => onChange(axis.name, value)}
                      className={`h-9 w-9 touch-manipulation rounded-full border-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${
                        !available
                          ? "cursor-not-allowed border-hairline opacity-40"
                          : isSelected
                            ? "border-secondary ring-2 ring-secondary/40 ring-offset-2 ring-offset-surface-1"
                            : "border-white/25 hover:border-white/50"
                      }`}
                      style={{ backgroundColor: hex ?? "var(--color-gray-700)" }}
                    />
                  );
                }

                return (
                  <button
                    key={value}
                    type="button"
                    title={available ? undefined : unavailableHint}
                    aria-pressed={isSelected}
                    disabled={!available}
                    onClick={() => onChange(axis.name, value)}
                    className={`h-9 min-w-12 touch-manipulation rounded-full border px-3.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${
                      !available
                        ? "cursor-not-allowed border-hairline text-white/25 line-through"
                        : isSelected
                          ? "border-secondary bg-secondary/20 text-ink"
                          : "border-white/20 text-ink hover:border-white/45"
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}
