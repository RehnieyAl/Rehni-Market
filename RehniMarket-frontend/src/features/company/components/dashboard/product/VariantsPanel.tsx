import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  getProductVariants,
  deleteVariant,
} from "@/features/company/api/variantService";

import type { VariantResponse } from "@/features/company/types/response";

import VariantModal from "./VariantModal";

interface VariantsPanelProps {
  productId: string;
  catalogId: string;
}

export default function VariantsPanel({ productId, catalogId }: VariantsPanelProps) {
  const [variants, setVariants] = useState<VariantResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [openModal, setOpenModal] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);

  const loadVariants = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getProductVariants(productId);
      setVariants(response);
    } catch (error) {
      console.error("Error cargando variantes:", error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadVariants();
    });

    return () => clearTimeout(timeout);
  }, [loadVariants]);

  const handleDelete = async (variantId: string) => {
    if (!window.confirm("¿Eliminar esta variante? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      setDeletingId(variantId);
      await deleteVariant(productId, variantId);
      setVariants((prev) => prev.filter((variant) => variant.id !== variantId));
    } catch (error) {
      console.error("Error eliminando variante:", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Variantes</h3>

        <button
          onClick={() => {
            setEditingVariantId(null);
            setOpenModal(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-red-700 px-3 py-2 text-sm text-white hover:bg-red-800"
        >
          <Plus size={16} />
          Agregar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
          <Loader2 size={18} className="animate-spin" />
          Cargando variantes...
        </div>
      ) : variants.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-5 text-center text-sm text-gray-400">
          Este producto todavía no tiene variantes.
        </div>
      ) : (
        <div className="space-y-3">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-3"
            >
              <div className="flex items-center gap-3">
                {variant.main_image_url ? (
                  <img
                    src={variant.main_image_url}
                    alt={variant.name}
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-gray-300 text-[10px] text-gray-400">
                    Sin imagen
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-900">{variant.name}</p>

                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    {variant.color && (
                      <span className="flex items-center gap-1">
                        <span
                          className="h-3 w-3 rounded-full border border-gray-300"
                          style={{ backgroundColor: variant.color.hex_color }}
                        />
                        {variant.color.name}
                      </span>
                    )}

                    <span>${Number(variant.price).toLocaleString()}</span>
                    <span>Stock: {variant.stock}</span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => {
                    setEditingVariantId(variant.id);
                    setOpenModal(true);
                  }}
                  className="rounded-lg p-2 hover:bg-gray-100"
                  title="Editar variante"
                >
                  <Pencil size={16} />
                </button>

                <button
                  onClick={() => handleDelete(variant.id)}
                  disabled={deletingId === variant.id}
                  className="rounded-lg p-2 text-red-700 hover:bg-red-50 disabled:opacity-50"
                  title="Eliminar variante"
                >
                  {deletingId === variant.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <VariantModal
        isOpen={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditingVariantId(null);
        }}
        onSuccess={loadVariants}
        productId={productId}
        catalogId={catalogId}
        variantId={editingVariantId}
        usedColorIds={variants
          .filter((variant) => variant.id !== editingVariantId)
          .map((variant) => variant.color?.id)
          .filter((id): id is string => Boolean(id))}
      />
    </div>
  );
}
