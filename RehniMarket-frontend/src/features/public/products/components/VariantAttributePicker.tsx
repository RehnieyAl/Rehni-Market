import { useMemo } from "react";

import type { PublicProductVariant } from "../types/response";
import { deriveVariantAxes } from "../utils/variantAxes";

interface VariantAttributePickerProps {
  variants: PublicProductVariant[];
  // { [attributeName]: value }
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

  // Disponibilidad jerárquica: una opción del eje N está habilitada si existe alguna
  // variante viva con stock que tenga ese valor y sea compatible con los ejes
  // ANTERIORES ya elegidos (< N). Los ejes posteriores no cuentan porque se limpian
  // al cambiar este eje; así cambiar un eje anterior nunca bloquea el selector.
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
    <div className="space-y-5">
      {axes.map((axis) => {
        const chosen = selected[axis.name];

        return (
          <div key={axis.name}>
            <h3 className="mb-2 text-sm font-semibold text-gray-900">
              {axis.name}
              {chosen ? `: ${chosen}` : ""}
            </h3>

            <div className="flex flex-wrap gap-2.5">
              {axis.values.map(({ value, hex }) => {
                const available = isAvailable(axis.name, value);
                const isSelected = chosen === value;

                if (axis.isColor) {
                  return (
                    <button
                      key={value}
                      type="button"
                      title={available ? value : `${value} (no disponible con la selección actual)`}
                      disabled={!available}
                      onClick={() => onChange(axis.name, value)}
                      className={`h-9 w-9 rounded-full border-2 transition ${
                        !available
                          ? "cursor-not-allowed border-gray-200 opacity-40"
                          : isSelected
                            ? "border-primary ring-2 ring-brand-600/25"
                            : "border-gray-300 hover:border-gray-400"
                      }`}
                      style={{ backgroundColor: hex ?? "#e5e7eb" }}
                    />
                  );
                }

                return (
                  <button
                    key={value}
                    type="button"
                    title={
                      available ? undefined : `${value} (no disponible con la selección actual)`
                    }
                    disabled={!available}
                    onClick={() => onChange(axis.name, value)}
                    className={`rounded-control border px-3.5 py-2 text-sm font-medium transition ${
                      !available
                        ? "cursor-not-allowed border-gray-200 text-gray-300 line-through"
                        : isSelected
                          ? "border-primary bg-primary text-primary-fg"
                          : "border-gray-300 text-gray-700 hover:border-gray-400"
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
    </div>
  );
}
