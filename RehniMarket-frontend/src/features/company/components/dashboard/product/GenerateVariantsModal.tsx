import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import axios from "axios";

import { getCatalogAttributes } from "@/features/company/api/catalogService";
import { createVariant, generateCombinations } from "@/features/company/api/variantService";
import { useAlert } from "@/shared/components/alert/useAlert";
import { Spinner } from "@/shared/components/ui";
import { parseNumericField } from "@/shared/utils/parseNumericField";

import type { CatalogAttribute } from "@/features/company/types/catalogAttributes";
import type { GeneratedCombination } from "@/features/company/types/response";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productId: string;
  catalogId: string;
}

// El backend genera el producto cartesiano; aquí solo se eligen los ejes y se crean
// las combinaciones que falten con un precio y stock base.
export default function GenerateVariantsModal({
  isOpen,
  onClose,
  onSuccess,
  productId,
  catalogId,
}: Props) {
  const { showAlert } = useAlert();

  const [axes, setAxes] = useState<CatalogAttribute[]>([]);
  const [selectedAxisIds, setSelectedAxisIds] = useState<Set<string>>(new Set());
  const [combinations, setCombinations] = useState<GeneratedCombination[] | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(new Set());

  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setCombinations(null);
        setChosen(new Set());
        setPrice("");
        setStock("");

        const attributes = await getCatalogAttributes(catalogId);
        if (cancelled) return;

        const variantAxes = attributes.variant_attributes.filter(
          (axis) => axis.options.length > 0,
        );
        setAxes(variantAxes);
        setSelectedAxisIds(new Set(variantAxes.map((axis) => axis.id)));
      } catch (error) {
        console.error("Error cargando atributos:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, catalogId]);

  const axisColumns = useMemo(() => {
    if (!combinations || combinations.length === 0) return [];
    return combinations[0].options.map((option) => option.attribute_name);
  }, [combinations]);

  if (!isOpen) return null;

  const toggleAxis = (axisId: string) => {
    setSelectedAxisIds((prev) => {
      const next = new Set(prev);
      if (next.has(axisId)) next.delete(axisId);
      else next.add(axisId);
      return next;
    });
    setCombinations(null);
  };

  const handlePreview = async () => {
    try {
      setPreviewing(true);
      const result = await generateCombinations(
        productId,
        axes.filter((axis) => selectedAxisIds.has(axis.id)).map((axis) => axis.id),
      );
      setCombinations(result);
      setChosen(new Set(result.filter((combo) => !combo.exists).map((c) => c.combo_key)));
    } catch (error) {
      const detail = axios.isAxiosError(error) ? error.response?.data?.detail : undefined;
      showAlert("error", detail?.message ?? "No se pudieron generar las combinaciones.");
    } finally {
      setPreviewing(false);
    }
  };

  const handleCreate = async () => {
    const parsedPrice = parseNumericField(price);
    const parsedStock = parseNumericField(stock, { integer: true });

    if (parsedPrice === null || parsedPrice < 0 || parsedStock === null || parsedStock < 0) {
      showAlert("error", "Ingresa un precio y un stock base válidos.");
      return;
    }

    const toCreate = (combinations ?? []).filter(
      (combo) => !combo.exists && chosen.has(combo.combo_key),
    );

    if (toCreate.length === 0) {
      showAlert("error", "Selecciona al menos una combinación nueva.");
      return;
    }

    try {
      setCreating(true);

      let created = 0;
      for (const combo of toCreate) {
        await createVariant(productId, {
          name: combo.options.map((option) => option.value).join(" / "),
          sku: null,
          price: parsedPrice,
          stock: parsedStock,
          option_ids: combo.options.map((option) => option.option_id),
          attribute_values: [],
          discount_enable: false,
          discount_value: 0,
          discount_type: null,
          discount_starts_at: null,
          discount_ends_at: null,
        });
        created += 1;
      }

      showAlert("success", `${created} variante(s) creada(s).`);
      onSuccess();
      onClose();
    } catch (error) {
      const detail = axios.isAxiosError(error) ? error.response?.data?.detail : undefined;
      showAlert(
        "error",
        detail?.message ??
          "Algunas combinaciones no se pudieron crear. Revisa la lista y reintenta.",
      );
      onSuccess();
    } finally {
      setCreating(false);
    }
  };

  const newCount = (combinations ?? []).filter(
    (combo) => !combo.exists && chosen.has(combo.combo_key),
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold">Generar combinaciones</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-16 text-sm text-gray-500">
            <Spinner /> Cargando ejes de variante...
          </div>
        ) : axes.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">
            La categoría de este producto no tiene ejes de variante con opciones configuradas.
          </p>
        ) : (
          <div className="space-y-5 p-6">
            <div>
              <p className="mb-2 text-sm font-medium text-gray-800">Ejes a combinar</p>
              <div className="flex flex-wrap gap-2">
                {axes.map((axis) => {
                  const active = selectedAxisIds.has(axis.id);
                  return (
                    <button
                      key={axis.id}
                      type="button"
                      onClick={() => toggleAxis(axis.id)}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                        active
                          ? "border-primary bg-primary text-primary-fg"
                          : "border-gray-300 text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {axis.name} ({axis.options.length})
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handlePreview}
              disabled={previewing || selectedAxisIds.size === 0}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {previewing ? "Calculando..." : "Ver combinaciones"}
            </button>

            {combinations && combinations.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Crear</th>
                      {axisColumns.map((column) => (
                        <th key={column} className="px-3 py-2">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {combinations.map((combo) => (
                      <tr key={combo.combo_key} className="border-t border-gray-100">
                        <td className="px-3 py-2">
                          {combo.exists ? (
                            <span className="text-xs text-gray-400">ya existe</span>
                          ) : (
                            <input
                              type="checkbox"
                              checked={chosen.has(combo.combo_key)}
                              onChange={(e) =>
                                setChosen((prev) => {
                                  const next = new Set(prev);
                                  if (e.target.checked) next.add(combo.combo_key);
                                  else next.delete(combo.combo_key);
                                  return next;
                                })
                              }
                            />
                          )}
                        </td>
                        {combo.options.map((option) => (
                          <td key={option.attribute_id} className="px-3 py-2 text-gray-700">
                            {option.value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {combinations && combinations.length === 0 && (
              <p className="text-sm text-gray-500">
                No hay combinaciones posibles con los ejes seleccionados.
              </p>
            )}

            {combinations && newCount > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-gray-700">Precio base</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-600"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">Stock base</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-600"
                  />
                </div>
              </div>
            )}

            {combinations && (
              <p className="text-xs text-gray-500">
                Se crearán <strong>{newCount}</strong> variante(s). Podrás ajustar precio,
                stock, descuento e imágenes de cada una después.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !combinations || newCount === 0}
            className="rounded-lg bg-primary px-5 py-2 text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {creating ? "Creando..." : "Crear seleccionadas"}
          </button>
        </div>
      </div>
    </div>
  );
}
