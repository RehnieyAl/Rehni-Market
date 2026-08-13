import { X, Upload, Trash2, Loader2, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  getVariantDetail,
  createVariant,
  updateVariant,
  uploadVariantImages,
  deleteVariantImage,
  setMainVariantImage,
  createVariantSpecification,
  updateVariantSpecification,
  deleteVariantSpecification,
} from "@/features/company/api/variantService";

import { getColors } from "@/features/company/api/colorService";
import { getCatalogSpecifications } from "@/features/company/api/catalogService";

import SpecificationChecklist from "./SpecificationChecklist";

import type {
  ColorResponse,
  SpecificationResponse,
  VariantDetailResponse,
} from "@/features/company/types/response";

import type { ProductSpecification, VariantImage } from "@/features/company/types/request";

interface VariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productId: string;
  catalogId: string;
  // null -> modo creación. Con valor -> modo edición de esa variante.
  variantId: string | null;
  // Colores ya usados por OTRAS variantes del producto, para evitar que
  // la empresa intente crear un duplicado (el backend igual lo valida).
  usedColorIds: string[];
}

export default function VariantModal({
  isOpen,
  onClose,
  onSuccess,
  productId,
  catalogId,
  variantId,
  usedColorIds,
}: VariantModalProps) {
  const isEditMode = variantId !== null;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [colors, setColors] = useState<ColorResponse[]>([]);
  const [specTemplates, setSpecTemplates] = useState<SpecificationResponse[]>([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">("");
  const [colorId, setColorId] = useState("");

  // Descuento propio de la variante - solo editable en modo edición (igual
  // que el descuento del producto base, que tampoco existe en el flujo de
  // creación - ver ProductForm.tsx).
  const [discountEnable, setDiscountEnable] = useState(false);
  const [discountValue, setDiscountValue] = useState<number | "">("");

  // Modo creación: especificaciones e imágenes viajan juntas con el
  // formulario, en el mismo POST (igual que ProductForm al crear producto).
  const [newSpecifications, setNewSpecifications] = useState<ProductSpecification[]>([]);
  const [newImages, setNewImages] = useState<VariantImage[]>([]);

  // Modo edición: la variante ya existe, así que cada acción (agregar
  // imagen, borrar especificación, marcar principal...) llama a su propio
  // endpoint de inmediato y refresca el detalle.
  const [variant, setVariant] = useState<VariantDetailResponse | null>(null);
  const [imageActionId, setImageActionId] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Modo edición: plantillas marcadas por la empresa pero que todavía no
  // tienen un valor guardado en el backend (checkbox activado, input
  // vacío). Solo se llama al endpoint de creación cuando escriben un
  // valor y salen del campo (ver handleSpecificationValueChange).
  const [pendingSpecTemplateIds, setPendingSpecTemplateIds] = useState<Set<string>>(new Set());
  const [specActionTemplateId, setSpecActionTemplateId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    newImages.forEach((image) => URL.revokeObjectURL(image.preview));

    setName("");
    setPrice("");
    setStock("");
    setColorId("");
    setDiscountEnable(false);
    setDiscountValue("");
    setNewSpecifications([]);
    setNewImages([]);
    setVariant(null);
    setLoadError(null);
    setPendingSpecTemplateIds(new Set());
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Carga colores y especificaciones del catálogo del producto siempre que
  // el modal se abre, y el detalle real de la variante si es edición.
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const [colorsResponse, specsResponse] = await Promise.all([
          getColors(),
          getCatalogSpecifications(catalogId),
        ]);

        if (cancelled) return;

        setColors(colorsResponse);
        setSpecTemplates(specsResponse);

        if (variantId) {
          const detail = await getVariantDetail(productId, variantId);

          if (cancelled) return;

          setVariant(detail);
          setName(detail.name);
          setPrice(Number(detail.price));
          setStock(detail.stock);
          setColorId(detail.color?.id ?? "");
          setDiscountEnable(detail.discount_enable);
          setDiscountValue(Number(detail.discount_value));
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

  const handleDeleteExistingImage = async (imageId: string) => {
    if (!variantId) return;
    if (!window.confirm("¿Eliminar esta imagen?")) return;

    try {
      setImageActionId(imageId);
      const detail = await deleteVariantImage(productId, variantId, imageId);
      setVariant(detail);
      onSuccess();
    } catch (error) {
      console.error("Error eliminando imagen:", error);
    } finally {
      setImageActionId(null);
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
    } finally {
      setImageActionId(null);
    }
  };

  // Especificaciones ya guardadas en el backend, indexadas por plantilla
  // (modo edición).
  const existingSpecByTemplateId = new Map(
    (variant?.specifications ?? []).map((spec) => [spec.specification_template_id, spec]),
  );

  // Valores mostrados en el checklist: en creación, la lista local; en
  // edición, lo ya guardado más lo marcado-pero-todavía-sin-valor
  // (pendiente), para que el checkbox aparezca activado de inmediato.
  const specValues: ProductSpecification[] = isEditMode
    ? [
        ...(variant?.specifications ?? []).map((spec) => ({
          specificationTemplateId: spec.specification_template_id,
          value: spec.value,
        })),
        ...Array.from(pendingSpecTemplateIds)
          .filter((templateId) => !existingSpecByTemplateId.has(templateId))
          .map((templateId) => ({ specificationTemplateId: templateId, value: "" })),
      ]
    : newSpecifications;

  // Al marcar el checkbox: en creación se agrega localmente (se envía
  // junto con el resto al crear la variante); en edición solo queda
  // "pendiente" hasta que la empresa escriba un valor - no existe
  // specification_template sin valor en el backend.
  //
  // Al desmarcar: en creación se descarta localmente; en edición, si ya
  // tenía un valor guardado se elimina con el endpoint dedicado.
  const handleToggleSpecification = async (templateId: string, checked: boolean) => {
    if (!isEditMode) {
      setNewSpecifications((prev) =>
        checked
          ? [...prev, { specificationTemplateId: templateId, value: "" }]
          : prev.filter((spec) => spec.specificationTemplateId !== templateId),
      );
      return;
    }

    if (!variantId) return;

    if (checked) {
      setPendingSpecTemplateIds((prev) => new Set(prev).add(templateId));
      return;
    }

    setPendingSpecTemplateIds((prev) => {
      const next = new Set(prev);
      next.delete(templateId);
      return next;
    });

    const existing = existingSpecByTemplateId.get(templateId);
    if (!existing) return;

    try {
      setSpecActionTemplateId(templateId);
      const detail = await deleteVariantSpecification(productId, variantId, existing.id);
      setVariant(detail);
      onSuccess();
    } catch (error) {
      console.error("Error eliminando especificación:", error);
      setPendingSpecTemplateIds((prev) => new Set(prev).add(templateId));
    } finally {
      setSpecActionTemplateId(null);
    }
  };

  // Al salir de un campo con un valor no vacío: en creación se guarda
  // localmente; en edición se crea (si estaba pendiente) o se actualiza
  // (si ya existía) de inmediato contra el backend.
  const handleSpecificationValueChange = async (templateId: string, value: string) => {
    const trimmed = value.trim();

    if (!isEditMode) {
      if (trimmed === "") return;

      setNewSpecifications((prev) =>
        prev.map((spec) =>
          spec.specificationTemplateId === templateId ? { ...spec, value: trimmed } : spec,
        ),
      );
      return;
    }

    if (!variantId || trimmed === "") return;

    const existing = existingSpecByTemplateId.get(templateId);

    try {
      setSpecActionTemplateId(templateId);

      const detail = existing
        ? await updateVariantSpecification(productId, variantId, existing.id, { value: trimmed })
        : await createVariantSpecification(productId, variantId, {
            specificationTemplateId: templateId,
            value: trimmed,
          });

      setVariant(detail);

      setPendingSpecTemplateIds((prev) => {
        const next = new Set(prev);
        next.delete(templateId);
        return next;
      });

      onSuccess();
    } catch (error) {
      console.error("Error guardando especificación:", error);
    } finally {
      setSpecActionTemplateId(null);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !colorId || price === "" || stock === "") return;

    try {
      setSaving(true);

      if (isEditMode && variantId) {
        const patch: Parameters<typeof updateVariant>[2] = {};

        if (variant && name !== variant.name) patch.name = name;
        if (variant && Number(price) !== Number(variant.price)) patch.price = Number(price);
        if (variant && discountEnable !== variant.discount_enable) {
          patch.discountEnable = discountEnable;
        }
        if (
          variant &&
          discountValue !== "" &&
          Number(discountValue) !== Number(variant.discount_value)
        ) {
          patch.discountValue = Number(discountValue);
        }
        if (variant && Number(stock) !== variant.stock) patch.stock = Number(stock);
        if (variant && colorId !== (variant.color?.id ?? "")) patch.colorId = colorId;

        if (Object.keys(patch).length > 0) {
          await updateVariant(productId, variantId, patch);
        }
      } else {
        await createVariant(productId, {
          name: name.trim(),
          price: Number(price),
          stock: Number(stock),
          colorId,
          // No se envían especificaciones marcadas pero sin valor todavía.
          specifications: newSpecifications.filter((spec) => spec.value.trim() !== ""),
          images: newImages,
        });
      }

      resetForm();
      onClose();
      onSuccess();
    } catch (error) {
      console.error("Error guardando la variante:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const existingImages = variant?.images ?? [];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-3 sm:p-6">
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
            <div>
              <label className="mb-2 block text-sm text-gray-700">Nombre</label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Camiseta talla M color negro"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-700">
                Color <span className="text-red-500">*</span>
              </label>

              <div className="flex items-center gap-3">
                <select
                  value={colorId}
                  onChange={(e) => setColorId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                >
                  <option value="">Seleccione un color</option>

                  {colors.map((color) => {
                    const isCurrentColor = isEditMode && color.id === (variant?.color?.id ?? "");
                    const isDuplicate = usedColorIds.includes(color.id) && !isCurrentColor;

                    return (
                      <option key={color.id} value={color.id} disabled={isDuplicate}>
                        {color.name}
                        {isDuplicate ? " (ya usado en otra variante)" : ""}
                      </option>
                    );
                  })}
                </select>

                {colorId && (
                  <span
                    className="h-9 w-9 shrink-0 rounded-full border border-gray-300"
                    style={{
                      backgroundColor: colors.find((color) => color.id === colorId)?.hex_color,
                    }}
                  />
                )}
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Cada variante debe tener exactamente un color, y no puede repetirse dentro del
                mismo producto.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-gray-700">Precio</label>

                <input
                  type="text"
                  inputMode="numeric"
                  value={price}
                  onChange={(e) =>
                    setPrice(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-700">Stock</label>

                <input
                  type="text"
                  inputMode="numeric"
                  value={stock}
                  onChange={(e) =>
                    setStock(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Descuento: solo disponible al editar, igual que el
                descuento del producto base (no existe en el flujo de
                creación). */}
            {isEditMode && (
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={discountEnable}
                    onChange={(e) => {
                      setDiscountEnable(e.target.checked);
                      if (!e.target.checked) setDiscountValue(0);
                    }}
                  />
                  Variante en descuento
                </label>

                {discountEnable && (
                  <input
                    type="text"
                    inputMode="numeric"
                    value={discountValue}
                    onChange={(e) => {
                      if (e.target.value === "") {
                        setDiscountValue("");
                        return;
                      }

                      const parsed = Number(e.target.value);

                      setDiscountValue(Math.min(100, Math.max(0, parsed)));
                    }}
                    placeholder="Porcentaje de descuento (%)"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                  />
                )}
              </div>
            )}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Imágenes</label>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages}
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

              <p className="mb-4 text-xs text-gray-500">
                {isEditMode
                  ? "Haz clic sobre una imagen existente para convertirla en la principal."
                  : "La primera imagen que agregues será la principal. Podrás cambiarla después de crear la variante."}
              </p>

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
                          handleDeleteExistingImage(image.id);
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveNewImage(index);
                      }}
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

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Especificaciones disponibles
              </label>

              <p className="mb-4 text-xs text-gray-500">
                Estas especificaciones las administra el equipo de
                Rehni-Market para cada categoría. Selecciona las que
                apliquen a esta variante y asigna su valor (por ejemplo,
                Talla → M).
              </p>

              <SpecificationChecklist
                templates={specTemplates}
                values={specValues}
                onToggle={handleToggleSpecification}
                onValueChange={handleSpecificationValueChange}
                savingTemplateId={specActionTemplateId}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-4 border-t border-gray-200 px-6 py-5">
          <button onClick={handleClose} className="rounded-lg border border-gray-300 px-5 py-2 hover:bg-gray-100">
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={saving || loading || !name.trim() || !colorId || price === "" || stock === ""}
            className="rounded-lg bg-red-700 px-6 py-2 text-white hover:bg-red-800 disabled:opacity-50"
          >
            {saving ? "Guardando..." : isEditMode ? "Guardar cambios" : "Crear variante"}
          </button>
        </div>
      </div>
    </div>
  );
}
