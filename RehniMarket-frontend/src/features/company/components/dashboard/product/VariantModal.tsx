import { X, Upload, Trash2, Loader2, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

import {
  getVariantDetail,
  createVariant,
  updateVariant,
  uploadVariantImages,
  deleteVariantImage,
  setMainVariantImage,
} from "@/features/company/api/variantService";
import { getCatalogAttributes } from "@/features/company/api/catalogService";

import DiscountFields from "./DiscountFields";
import {
  discountToLocalState,
  localStateToDiscountInput,
  type DiscountFormState,
} from "./discountForm";
import ConfirmModal from "@/shared/components/ConfirmModal";
import { useAlert } from "@/shared/components/alert/useAlert";
import { parseNumericField } from "@/shared/utils/parseNumericField";

import type { VariantDetailResponse } from "@/features/company/types/response";
import type { VariantImage } from "@/features/company/types/request";
import type { CatalogAttribute } from "@/features/company/types/catalogAttributes";

interface VariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productId: string;
  catalogId: string;
  variantId: string | null;
}

function extractDetail(error: unknown) {
  return axios.isAxiosError(error) ? error.response?.data?.detail : undefined;
}

export default function VariantModal({
  isOpen,
  onClose,
  onSuccess,
  productId,
  catalogId,
  variantId,
}: VariantModalProps) {
  const isEditMode = variantId !== null;
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [axes, setAxes] = useState<CatalogAttribute[]>([]);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  // { [attributeId]: optionId }
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [discount, setDiscount] = useState<DiscountFormState>(discountToLocalState(null));
  const [errors, setErrors] = useState<{ price?: string; stock?: string }>({});

  const [newImages, setNewImages] = useState<VariantImage[]>([]);
  const [variant, setVariant] = useState<VariantDetailResponse | null>(null);
  const [imageActionId, setImageActionId] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [confirmDeleteImageId, setConfirmDeleteImageId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    newImages.forEach((image) => URL.revokeObjectURL(image.preview));
    setName("");
    setSku("");
    setPrice("");
    setStock("");
    setSelectedOptions({});
    setDiscount(discountToLocalState(null));
    setNewImages([]);
    setVariant(null);
    setLoadError(null);
    setFormError(null);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const attributes = await getCatalogAttributes(catalogId);
        if (cancelled) return;
        setAxes(attributes.variant_attributes);

        if (variantId) {
          const detail = await getVariantDetail(productId, variantId);
          if (cancelled) return;

          setVariant(detail);
          setName(detail.name);
          setSku(detail.sku ?? "");
          setPrice(detail.price);
          setStock(String(detail.stock));
          setSelectedOptions(
            Object.fromEntries(
              detail.options.map((option) => [option.attribute_id, option.option_id]),
            ),
          );
          setDiscount(
            discountToLocalState({
              discount_enable: detail.discount_enable,
              discount_value: detail.discount_value,
              discount_type: detail.discount_type,
              discount_starts_at: detail.discount_starts_at,
              discount_ends_at: detail.discount_ends_at,
            }),
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error cargando la variante:", error);
          setLoadError("No se pudo cargar la información de la variante.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [isOpen, variantId, productId, catalogId]);

  // Nombre por defecto a partir de las opciones elegidas (Negro / 40).
  const suggestedName = useMemo(() => {
    const parts = axes
      .map((axis) => {
        const optionId = selectedOptions[axis.id];
        return axis.options.find((option) => option.id === optionId)?.value;
      })
      .filter((value): value is string => Boolean(value));
    return parts.join(" / ");
  }, [axes, selectedOptions]);

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const added = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    if (isEditMode && variantId) {
      setUploadingImages(true);
      uploadVariantImages(productId, variantId, Array.from(files))
        .then((detail) => {
          setVariant(detail);
          onSuccess();
        })
        .catch((error) => {
          console.error("Error subiendo imágenes:", error);
          showAlert("error", "No se pudieron subir las imágenes.");
        })
        .finally(() => setUploadingImages(false));
    } else {
      setNewImages((prev) => [...prev, ...added]);
    }

    e.target.value = "";
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages((prev) => {
      const image = prev[index];
      if (image) URL.revokeObjectURL(image.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDeleteExistingImage = async () => {
    if (!variantId || !confirmDeleteImageId) return;

    try {
      setImageActionId(confirmDeleteImageId);
      const detail = await deleteVariantImage(productId, variantId, confirmDeleteImageId);
      setVariant(detail);
      onSuccess();
    } catch (error) {
      console.error("Error eliminando imagen:", error);
      showAlert("error", "No se pudo eliminar la imagen.");
    } finally {
      setImageActionId(null);
      setConfirmDeleteImageId(null);
    }
  };

  const handleSetMainExistingImage = async (imageId: string) => {
    if (!variantId) return;

    try {
      setImageActionId(imageId);
      const detail = await setMainVariantImage(productId, variantId, imageId);
      setVariant(detail);
      onSuccess();
    } catch (error) {
      console.error("Error marcando imagen principal:", error);
      showAlert("error", "No se pudo marcar la imagen como principal.");
    } finally {
      setImageActionId(null);
    }
  };

  const missingAxis = axes.some((axis) => !selectedOptions[axis.id]);
  const effectiveName = name.trim() || suggestedName;

  const handleSubmit = async () => {
    const parsedPrice = parseNumericField(price);
    const parsedStock = parseNumericField(stock, { integer: true });

    const nextErrors: typeof errors = {};
    if (parsedPrice === null || parsedPrice < 0) {
      nextErrors.price = "Ingresa un precio válido (un número mayor o igual a 0).";
    }
    if (parsedStock === null || parsedStock < 0) {
      nextErrors.stock =
        "Ingresa una cantidad de stock válida (un número entero mayor o igual a 0).";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setFormError(null);

    if (!effectiveName) {
      setFormError("Asigna un nombre o elige las opciones de la variante.");
      return;
    }
    if (missingAxis) {
      setFormError("Selecciona una opción para cada eje de variante.");
      return;
    }

    const discountResult = localStateToDiscountInput(discount);
    if ("error" in discountResult) {
      setFormError(discountResult.error);
      return;
    }
    const discountInput = discountResult.value;

    const optionIds = axes
      .map((axis) => selectedOptions[axis.id])
      .filter((id): id is string => Boolean(id));

    try {
      setSaving(true);

      if (isEditMode && variantId && variant) {
        await updateVariant(productId, variantId, {
          name: effectiveName !== variant.name ? effectiveName : undefined,
          sku: (sku.trim() || null) !== variant.sku ? sku.trim() || null : undefined,
          price:
            (parsedPrice as number) !== Number(variant.price)
              ? (parsedPrice as number)
              : undefined,
          stock: (parsedStock as number) !== variant.stock ? (parsedStock as number) : undefined,
          option_ids: optionIds,
          discount_enable: discountInput.discount_enable,
          discount_value: discountInput.discount_value,
          discount_type: discountInput.discount_type,
          discount_starts_at: discountInput.discount_starts_at,
          discount_ends_at: discountInput.discount_ends_at,
        });
      } else {
        const created = await createVariant(productId, {
          name: effectiveName,
          sku: sku.trim() || null,
          price: parsedPrice as number,
          stock: parsedStock as number,
          option_ids: optionIds,
          attribute_values: [],
          discount_enable: discountInput.discount_enable,
          discount_value: discountInput.discount_value,
          discount_type: discountInput.discount_type,
          discount_starts_at: discountInput.discount_starts_at,
          discount_ends_at: discountInput.discount_ends_at,
        });

        if (newImages.length > 0) {
          await uploadVariantImages(
            productId,
            created.id,
            newImages.map((image) => image.file),
          );
        }
      }

      resetForm();
      onClose();
      onSuccess();
    } catch (error) {
      console.error("Error guardando la variante:", error);
      const detail = extractDetail(error);
      setFormError(detail?.message ?? "No se pudo guardar la variante.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const existingImages = variant?.images ?? [];
  const isDeleted = variant?.deleted_at != null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold">
            {isEditMode ? "Editar variante" : "Agregar variante"}
          </h2>

          <button onClick={handleClose} className="rounded-lg p-2 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-16 text-gray-500">
            <Loader2 className="animate-spin" size={20} />
            Cargando variante...
          </div>
        ) : loadError ? (
          <div className="p-16 text-center text-red-600">{loadError}</div>
        ) : (
          <div className="space-y-6 p-6">
            {isDeleted && (
              <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Esta variante fue eliminada. El backend no permite editarla; vuelve a crear la
                combinación si la necesitas.
              </p>
            )}

            {axes.length > 0 ? (
              <div className="space-y-4">
                {axes.map((axis) => (
                  <div key={axis.id}>
                    <label className="mb-2 block text-sm text-gray-700">
                      {axis.name} <span className="text-red-500">*</span>
                    </label>

                    <div className="flex flex-wrap gap-2">
                      {axis.options.map((option) => {
                        const active = selectedOptions[axis.id] === option.id;
                        const isColor = axis.input_type === "color";

                        return (
                          <button
                            key={option.id}
                            type="button"
                            disabled={isDeleted}
                            onClick={() =>
                              setSelectedOptions((prev) => ({
                                ...prev,
                                [axis.id]: option.id,
                              }))
                            }
                            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition disabled:opacity-50 ${
                              active
                                ? "border-red-600 bg-red-600 text-white"
                                : "border-gray-300 text-gray-700 hover:border-gray-400"
                            }`}
                          >
                            {isColor && option.hex_color && (
                              <span
                                className="h-3.5 w-3.5 rounded-full border border-white/40"
                                style={{ backgroundColor: option.hex_color }}
                              />
                            )}
                            {option.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                La categoría de este producto no tiene ejes de variante configurados.
              </p>
            )}

            <div>
              <label className="mb-2 block text-sm text-gray-700">Nombre</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isDeleted}
                placeholder={suggestedName || "Nombre de la variante"}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500 disabled:opacity-50"
              />
              {!name.trim() && suggestedName && (
                <p className="mt-1 text-xs text-gray-400">Se usará: {suggestedName}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm text-gray-700">SKU</label>
                <input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  disabled={isDeleted}
                  placeholder="Opcional"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-700">Precio</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={isDeleted}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500 disabled:opacity-50"
                />
                {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-700">Stock</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  disabled={isDeleted}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500 disabled:opacity-50"
                />
                {errors.stock && <p className="mt-1 text-xs text-red-600">{errors.stock}</p>}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Descuento de la variante</p>
              <DiscountFields
                state={discount}
                onChange={setDiscount}
                label="Variante con descuento propio"
              />
              <p className="mt-2 text-xs text-gray-500">
                Sin descuento propio, el backend aplica el del producto si lo hay.
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Imágenes</label>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages || isDeleted}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:border-red-500 hover:text-red-600 disabled:opacity-50"
                >
                  {uploadingImages ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Upload size={16} />
                  )}
                  Agregar imágenes
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                hidden
                multiple
                accept="image/*"
                onChange={handleAddImages}
              />

              <div className="flex flex-wrap gap-4">
                {existingImages.map((image) => (
                  <div
                    key={image.id}
                    onClick={() => handleSetMainExistingImage(image.id)}
                    className={`relative cursor-pointer overflow-hidden rounded-xl border-2 transition ${
                      image.is_main
                        ? "border-red-600"
                        : "border-gray-200 hover:border-red-400"
                    }`}
                  >
                    <img src={image.url} alt="" className="h-24 w-24 object-cover" />

                    {image.is_main && (
                      <span className="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-xs text-white">
                        <Star size={10} /> Principal
                      </span>
                    )}

                    {imageActionId === image.id ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Loader2 size={18} className="animate-spin text-white" />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteImageId(image.id);
                        }}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow hover:bg-red-700"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}

                {newImages.map((image, index) => (
                  <div
                    key={index}
                    className={`relative overflow-hidden rounded-xl border-2 ${
                      index === 0 ? "border-red-600" : "border-gray-200"
                    }`}
                  >
                    <img src={image.preview} alt="" className="h-24 w-24 object-cover" />

                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-xs text-white">
                        <Star size={10} /> Principal
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveNewImage(index)}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow hover:bg-red-700"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}

                {existingImages.length === 0 && newImages.length === 0 && (
                  <div className="flex h-24 w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-400">
                    No has agregado imágenes.
                  </div>
                )}
              </div>
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}
          </div>
        )}

        <div className="flex justify-end gap-4 border-t border-gray-200 px-6 py-5">
          <button
            onClick={handleClose}
            className="rounded-lg border border-gray-300 px-5 py-2 hover:bg-gray-100"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={saving || loading || isDeleted || price === "" || stock === ""}
            className="rounded-lg bg-red-700 px-6 py-2 text-white hover:bg-red-800 disabled:opacity-50"
          >
            {saving ? "Guardando..." : isEditMode ? "Guardar cambios" : "Crear variante"}
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmDeleteImageId !== null}
        title="Eliminar imagen"
        message="¿Eliminar esta imagen?"
        confirmLabel="Eliminar"
        loading={imageActionId === confirmDeleteImageId}
        onConfirm={handleDeleteExistingImage}
        onClose={() => setConfirmDeleteImageId(null)}
      />
    </div>
  );
}
