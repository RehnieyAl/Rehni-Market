import type {
  AttributeValueInput,
  CatalogAttribute,
} from "@/features/company/types/catalogAttributes";

interface AttributeValueFieldsProps {
  attributes: CatalogAttribute[];
  values: AttributeValueInput[];
  onChange: (attributeId: string, value: string) => void;
  emptyHint?: string;
}

export default function AttributeValueFields({
  attributes,
  values,
  onChange,
  emptyHint = "Selecciona una categoría para ver sus atributos.",
}: AttributeValueFieldsProps) {
  if (attributes.length === 0) {
    return <p className="text-sm text-gray-400">{emptyHint}</p>;
  }

  const valueFor = (attributeId: string) =>
    values.find((item) => item.attributeId === attributeId)?.value ?? "";

  return (
    <div className="space-y-4">
      {attributes.map((attribute) => {
        const current = valueFor(attribute.id);
        const hasOptions =
          attribute.input_type === "select" || attribute.input_type === "color";
        const selectedOption = attribute.options.find((option) => option.value === current);

        return (
          <div key={attribute.id}>
            <label className="mb-1.5 block text-sm text-gray-700">
              {attribute.name}
              {attribute.unit ? ` (${attribute.unit})` : ""}
            </label>

            {hasOptions ? (
              <div className="flex items-center gap-3">
                <select
                  value={current}
                  onChange={(e) => onChange(attribute.id, e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500"
                >
                  <option value="">Sin especificar</option>
                  {attribute.options.map((option) => (
                    <option key={option.id} value={option.value}>
                      {option.value}
                    </option>
                  ))}
                </select>

                {attribute.input_type === "color" && selectedOption?.hex_color && (
                  <span
                    className="h-8 w-8 shrink-0 rounded-full border border-gray-300"
                    style={{ backgroundColor: selectedOption.hex_color }}
                  />
                )}
              </div>
            ) : (
              <input
                type={attribute.input_type === "number" ? "number" : "text"}
                value={current}
                onChange={(e) => onChange(attribute.id, e.target.value)}
                placeholder="Sin especificar"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
