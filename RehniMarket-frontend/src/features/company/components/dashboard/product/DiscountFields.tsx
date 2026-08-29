import type { DiscountFormState } from "./discountForm";

interface DiscountFieldsProps {
  state: DiscountFormState;
  onChange: (next: DiscountFormState) => void;
  label: string;
}

export default function DiscountFields({ state, onChange, label }: DiscountFieldsProps) {
  const set = (patch: Partial<DiscountFormState>) => onChange({ ...state, ...patch });

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={state.enabled}
          onChange={(e) =>
            set(e.target.checked ? { enabled: true } : { enabled: false, value: "" })
          }
        />
        {label}
      </label>

      {state.enabled && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs text-gray-600">Tipo</label>
              <select
                value={state.type}
                onChange={(e) =>
                  set({ type: e.target.value === "fixed" ? "fixed" : "percent" })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500"
              >
                <option value="percent">Porcentaje (%)</option>
                <option value="fixed">Monto fijo ($)</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-gray-600">
                {state.type === "fixed" ? "Monto de descuento" : "Porcentaje de descuento"}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={state.value}
                onChange={(e) => set({ value: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs text-gray-600">
                Inicio (opcional)
              </label>
              <input
                type="datetime-local"
                value={state.startsAt}
                onChange={(e) => set({ startsAt: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-gray-600">Fin (opcional)</label>
              <input
                type="datetime-local"
                value={state.endsAt}
                onChange={(e) => set({ endsAt: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            El precio final lo calcula el backend a partir de esta configuración.
          </p>
        </div>
      )}
    </div>
  );
}
