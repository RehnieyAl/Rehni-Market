import { Loader2, Pencil, Plus, Trash2, Wand2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";

import { getProductVariants, deleteVariant } from "@/features/company/api/variantService";
import type { VariantResponse } from "@/features/company/types/response";

import ConfirmModal from "@/shared/components/ConfirmModal";
import { useAlert } from "@/shared/components/alert/useAlert";
import { Badge, Button, EmptyState, Spinner } from "@/shared/components/ui";
import { formatPrice } from "@/shared/utils/formatPrice";
import VariantModal from "./VariantModal";
import GenerateVariantsModal from "./GenerateVariantsModal";

interface VariantsPanelProps {
  productId: string;
  catalogId: string;
}

export default function VariantsPanel({ productId, catalogId }: VariantsPanelProps) {
  const { showAlert } = useAlert();

  const [variants, setVariants] = useState<VariantResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [openModal, setOpenModal] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);

  const loadVariants = useCallback(async () => {
    try {
      setLoading(true);
      setVariants(await getProductVariants(productId, includeDeleted));
    } catch (error) {
      console.error("Error cargando variantes:", error);
    } finally {
      setLoading(false);
    }
  }, [productId, includeDeleted]);

  useEffect(() => {
    const timeout = setTimeout(() => loadVariants());
    return () => clearTimeout(timeout);
  }, [loadVariants]);

  const handleDelete = async () => {
    if (!confirmDeleteId) return;

    try {
      setDeletingId(confirmDeleteId);
      await deleteVariant(productId, confirmDeleteId);
      await loadVariants();
    } catch (error) {
      const detail = axios.isAxiosError(error) ? error.response?.data?.detail : undefined;
      showAlert("error", detail?.message ?? "No se pudo eliminar la variante.");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="rounded-card border border-gray-200 p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Variantes</h3>
          <p className="mt-1 text-xs text-gray-500">
            Cada variante es la unidad que se vende: define su precio, stock, SKU,
            descuento e imágenes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leadingIcon={<Wand2 size={16} />}
            onClick={() => setGenerateOpen(true)}
          >
            Generar
          </Button>

          <Button
            size="sm"
            leadingIcon={<Plus size={16} />}
            onClick={() => {
              setEditingVariantId(null);
              setOpenModal(true);
            }}
          >
            Agregar
          </Button>
        </div>
      </div>

      <label className="mb-4 flex items-center gap-2 text-xs text-gray-600">
        <input
          type="checkbox"
          checked={includeDeleted}
          onChange={(e) => setIncludeDeleted(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 accent-brand-600"
        />
        Mostrar variantes eliminadas
      </label>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
          <Spinner /> Cargando variantes…
        </div>
      ) : variants.length === 0 ? (
        <EmptyState
          variant="plain"
          title="Este producto todavía no tiene variantes"
          description="Agrega al menos una variante para poder publicarlo."
        />
      ) : (
        <div className="space-y-3">
          {variants.map((variant) => {
            const deleted = variant.deleted_at != null;

            return (
              <div
                key={variant.id}
                className={`flex items-center justify-between gap-3 rounded-card border p-3 ${
                  deleted ? "border-gray-200 bg-gray-50 opacity-60" : "border-gray-200"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  {variant.main_image_url ? (
                    <img
                      src={variant.main_image_url}
                      alt={variant.name}
                      className="h-14 w-14 shrink-0 rounded-control object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-control border border-dashed border-gray-300 text-[10px] text-gray-400">
                      Sin imagen
                    </div>
                  )}

                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      {variant.name}
                      {deleted && <Badge>Eliminada</Badge>}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                      {variant.options.map((option) => (
                        <span
                          key={option.attribute_id}
                          className="flex items-center gap-1 rounded-full border border-gray-200 bg-surface-1 px-2 py-0.5"
                        >
                          {option.hex_color && (
                            <span
                              className="h-2.5 w-2.5 rounded-full border border-gray-300"
                              style={{ backgroundColor: option.hex_color }}
                            />
                          )}
                          {option.attribute_name}: {option.value}
                        </span>
                      ))}
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      {variant.sku && <span>SKU: {variant.sku}</span>}
                      <span className="font-medium text-gray-700">
                        {formatPrice(variant.effective_price)}
                      </span>
                      {variant.discount_percentage != null && (
                        <span className="rounded-full bg-success-bg px-1.5 py-0.5 text-[10px] font-semibold text-success">
                          -{variant.discount_percentage}%
                          {variant.discount_source === "product" ? " (producto)" : ""}
                        </span>
                      )}
                      <span>Stock: {variant.stock}</span>
                    </div>
                  </div>
                </div>

                {!deleted && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => {
                        setEditingVariantId(variant.id);
                        setOpenModal(true);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-control text-gray-600 transition hover:bg-gray-100"
                      title="Editar variante"
                      aria-label={`Editar variante ${variant.name}`}
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() => setConfirmDeleteId(variant.id)}
                      disabled={deletingId === variant.id}
                      className="flex h-9 w-9 items-center justify-center rounded-control text-danger transition hover:bg-danger-bg disabled:opacity-50"
                      title="Eliminar variante"
                      aria-label={`Eliminar variante ${variant.name}`}
                    >
                      {deletingId === variant.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
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
      />

      <GenerateVariantsModal
        isOpen={generateOpen}
        onClose={() => setGenerateOpen(false)}
        onSuccess={loadVariants}
        productId={productId}
        catalogId={catalogId}
      />

      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        title="Eliminar variante"
        message="La variante se marca como eliminada (soft-delete). Podrás volver a crear la combinación más adelante."
        confirmLabel="Eliminar"
        loading={deletingId !== null}
        onConfirm={handleDelete}
        onClose={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
