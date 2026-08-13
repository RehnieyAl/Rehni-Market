import { Loader2 } from "lucide-react";

import type { ProductSpecification } from "@/features/company/types/request";
import type { SpecificationResponse } from "@/features/company/types/response";

interface SpecificationChecklistProps {
  // Especificaciones disponibles del catálogo seleccionado (las crea y
  // administra ADMIN/OWNER - la empresa solo las selecciona y les asigna
  // un valor, nunca crea plantillas nuevas).
  templates: SpecificationResponse[];
  values: ProductSpecification[];
  onToggle: (templateId: string, checked: boolean) => void;
  onValueChange: (templateId: string, value: string) => void;
  // Id de la plantilla cuyo guardado remoto está en curso (modo edición
  // de variante, donde cada cambio llama a su propio endpoint).
  savingTemplateId?: string | null;
}

export default function SpecificationChecklist({
  templates,
  values,
  onToggle,
  onValueChange,
  savingTemplateId = null,
}: SpecificationChecklistProps) {
  if (templates.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        Selecciona un catálogo para ver sus especificaciones disponibles.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {templates.map((template) => {
        const current = values.find(
          (value) => value.specificationTemplateId === template.id,
        );
        const checked = current !== undefined;
        const isSaving = savingTemplateId === template.id;

        return (
          <div
            key={template.id}
            className="flex flex-col gap-2 rounded-lg border border-gray-100 p-2 sm:flex-row sm:items-center sm:gap-3 sm:border-none sm:p-0"
          >
            <label className="flex items-center gap-2 text-sm text-gray-700 sm:w-1/3 sm:shrink-0">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onToggle(template.id, e.target.checked)}
                className="h-4 w-4 shrink-0 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span>
                {template.name}
                {template.required && <span className="ml-1 text-red-500">*</span>}
              </span>
            </label>

            {checked && (
              <div className="flex flex-1 items-center gap-2">
                <input
                  key={template.id}
                  defaultValue={current?.value ?? ""}
                  onBlur={(e) => {
                    if (e.target.value !== (current?.value ?? "")) {
                      onValueChange(template.id, e.target.value);
                    }
                  }}
                  disabled={isSaving}
                  placeholder="Valor"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 disabled:opacity-50"
                />

                {isSaving && (
                  <Loader2 size={16} className="shrink-0 animate-spin text-gray-400" />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
