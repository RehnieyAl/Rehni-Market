import type { PublicAttribute, PublicProductVariant } from "../types/response";

interface VariantAttributePickerProps {
  attributes: PublicAttribute[];
  variants: PublicProductVariant[];
  // { [attributeId]: optionId }
  selected: Record<string, string>;
  onChange: (attributeId: string, optionId: string) => void;
}

// Selector dinámico de variante: un control por cada eje de la categoría
// (Color, Talla, Almacenamiento, Plataforma...). No asume "color".
//
// Selección inteligente (ver Fase 16): una opción se deshabilita cuando
// NO existe ninguna variante con stock compatible con lo ya elegido en
// los OTROS ejes - el comprador no descubre el error recién al pulsar
// "Comprar".
export default function VariantAttributePicker({
  attributes,
  variants,
  selected,
  onChange,
}: VariantAttributePickerProps) {
  if (attributes.length === 0) return null;

  const isOptionAvailable = (attributeId: string, optionId: string): boolean => {
    // Restricciones actuales: lo elegido en los demás ejes.
    const otherSelected = Object.entries(selected).filter(
      ([axisId, value]) => axisId !== attributeId && value,
    );

    return variants.some((variant) => {
      if (variant.stock <= 0) return false;
      if (!variant.option_ids.includes(optionId)) return false;

      return otherSelected.every(([, value]) => variant.option_ids.includes(value));
    });
  };

  return (
    <div className="space-y-5">
      {attributes.map((attribute) => {
        const chosen = selected[attribute.id];
        const chosenLabel = attribute.options.find((option) => option.id === chosen)?.label;
        const isColor = attribute.input_type === "color";

        return (
          <div key={attribute.id}>
            <h3 className="mb-2 text-sm font-semibold text-gray-900">
              {attribute.name}
              {attribute.unit ? ` (${attribute.unit})` : ""}
              {chosenLabel ? `: ${chosenLabel}` : ""}
            </h3>

            <div className="flex flex-wrap gap-2.5">
              {attribute.options.map((option) => {
                const available = isOptionAvailable(attribute.id, option.id);
                const isSelected = chosen === option.id;

                if (isColor) {
                  return (
                    <button
                      key={option.id}
                      type="button"
                      title={available ? option.label : `${option.label} (Sin stock)`}
                      disabled={!available}
                      onClick={() => onChange(attribute.id, option.id)}
                      className={`h-9 w-9 rounded-full border-2 transition ${
                        !available
                          ? "cursor-not-allowed border-gray-200 opacity-40"
                          : isSelected
                            ? "border-[#6D0F2D]"
                            : "border-gray-300 hover:border-gray-400"
                      }`}
                      style={{ backgroundColor: option.hex ?? "#e5e7eb" }}
                    />
                  );
                }

                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={!available}
                    onClick={() => onChange(attribute.id, option.id)}
                    className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
                      !available
                        ? "cursor-not-allowed border-gray-200 text-gray-300 line-through"
                        : isSelected
                          ? "border-[#6D0F2D] bg-[#6D0F2D] text-white"
                          : "border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {option.label}
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
