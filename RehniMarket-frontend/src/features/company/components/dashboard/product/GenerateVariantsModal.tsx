import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";

import { getCatalogAttributes } from "@/features/company/api/catalogService";
import { generateVariants } from "@/features/company/api/variantService";
import { useAlert } from "@/shared/components/alert/useAlert";
import { parseNumericField } from "@/shared/utils/parseNumericField";

import type { CatalogAttribute } from "@/features/company/types/response";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productId: string;
  catalogId: string;
}

// Generador de matriz: la empresa elige QUE valores ofrecer por cada eje
// y el backend crea todas las combinaciones que falten (ver
// generate_variants_service). No obliga a crear las 12 variantes a mano.
export default function GenerateVariantsModal({
  isOpen,
  onClose,
  onSuccess,
  productId,
  catalogId,
}: Props) {
  const { showAlert } = useAlert();

  const [axes, setAxes] = useState<CatalogAttribute[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // { [attributeId]: Set<optionId> }
  const [picked, setPicked] = useState<Record<string, Set<string>>>({});
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const response = await getCatalogAttributes(catalogId);
        if (!cancelled) {
          setAxes(response.filter((attribute) => attribute.role === "variant"));
          setPicked({});
          setPrice("");
          setStock("");
        }
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

  if (!isOpen) return null;

  const toggle = (attributeId: string, optionId: string) => {
    setPicked((prev) => {
      const next = { ...prev };
      const set = new Set(next[attributeId] ?? []);
      if (set.has(optionId)) set.delete(optionId);
      else set.add(optionId);
      next[attributeId] = set;
      return next;
    });
  };

  const combos = axes.reduce(
    (total, axis) => total * Math.max(1, (picked[axis.id]?.size ?? 0)),
    axes.length > 0 ? 1 : 0,
  );

  const ready =
    axes.length > 0 &&
    axes.every((axis) => (picked[axis.id]?.size ?? 0) > 0) &&
    price !== "" &&
    stock !== "";

  const handleGenerate = async () => {
    const parsedPrice = parseNumericField(price);
    const parsedStock = parseNumericField(stock, { integer: true });

    if (parsedPrice === null || parsedPrice < 0 || parsedStock === null || parsedStock < 0) {
      showAlert("error", "Ingresa un precio y un stock válidos.");
      return;
    }

    try {
      setSaving(true);
      const result = await generateVariants(productId, {
        axes: axes.map((axis) => ({
          attributeId: axis.id,
          optionIds: Array.from(picked[axis.id] ?? []),
        })),
        price: parsedPrice,
        stock: parsedStock,
      });
      showAlert(
        "success",
        `${result.created} combinación(es) creada(s), ${result.skipped} ya existían.`,
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error generando combinaciones:", error);
      showAlert("error", "No se pudieron generar las combinaciones.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold">Generar combinaciones</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-16 text-gray-500">
            <Loader2 className="animate-spin" size={20} />
            Cargando...
          </div>
        ) : axes.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">
            La categoría de este producto no tiene ejes de variante configurados.
          </p>
        ) : (
          <div className="space-y-5 p-6">
            {axes.map((axis) => (
              <div key={axis.id}>
                <p className="mb-2 text-sm font-medium text-gray-800">{axis.name}</p>
                <div className="flex flex-wrap gap-2">
                  {axis.options.map((option) => {
                    const active = picked[axis.id]?.has(option.id) ?? false;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => toggle(axis.id, option.id)}
                        className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                          active
                            ? "border-red-600 bg-red-600 text-white"
                            : "border-gray-300 text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm text-gray-700">Precio base</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">Stock base</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-red-500"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Se crearán hasta <strong>{combos}</strong> combinación(es). Las que ya existan se
              omiten. Podrás ajustar precio, stock e imágenes de cada una después.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100">
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            disabled={!ready || saving}
            className="rounded-lg bg-red-700 px-5 py-2 text-white hover:bg-red-800 disabled:opacity-50"
          >
            {saving ? "Generando..." : "Generar"}
          </button>
        </div>
      </div>
    </div>
  );
}
