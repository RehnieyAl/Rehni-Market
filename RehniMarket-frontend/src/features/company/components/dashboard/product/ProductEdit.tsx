import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  getProductDetail,
  updateProduct,
} from "@/features/company/api/productService";

import {
  getCatalogs,
  getCatalogSpecifications,
} from "@/features/company/api/catalogService";

import { getColors } from "@/features/company/api/colorService";

import VariantsPanel from "./VariantsPanel";
import SpecificationChecklist from "./SpecificationChecklist";
import { parseNumericField } from "@/shared/utils/parseNumericField";

import type { UpdateProductRequest, ProductSpecification } from "@/features/company/types/request";

import type {
  CatalogResponse,
  ColorResponse,
  SpecificationResponse,
  ProductDetailResponse,
} from "@/features/company/types/response";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
  onSuccess: () => void;
}

interface NewImage {
  file: File;
  preview: string;
}

export default function EditProductModal({
  isOpen,
  onClose,
  productId,
  onSuccess,
}: EditProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [product, setProduct] = useState<ProductDetailResponse | null>(null);
  const [catalogs, setCatalogs] = useState<CatalogResponse[]>([]);
  const [colors, setColors] = useState<ColorResponse[]>([]);
  const [specTemplates, setSpecTemplates] = useState<SpecificationResponse[]>([]);
  const [specValues, setSpecValues] = useState<ProductSpecification[]>([]);

  const [nameProduct, setNameProduct] = useState("");
  const [catalogId, setCatalogId] = useState("");
  // String crudo mientras se escribe; la conversión a número ocurre al enviar.
  const [priceProduct, setPriceProduct] = useState("");
  const [discountEnable, setDiscountEnable] = useState(false);
  const [discountValue, setDiscountValue] = useState("");
  const [stockProduct, setStockProduct] = useState("");
  const [descripcionProduct, setDescripcionProduct] = useState("");
  const [mainColorId, setMainColorId] = useState("");
  const [errors, setErrors] = useState<{ price?: string; stock?: string; discount?: string }>({});

  const [existingImages, setExistingImages] = useState<ProductDetailResponse["images"]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<Set<string>>(new Set());
  const [selectedMainImageId, setSelectedMainImageId] = useState<string | null>(null);
  const [newImages, setNewImages] = useState<NewImage[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carga el producto y los catálogos/colores al abrir el modal para un producto distinto.
  useEffect(() => {
    if (!isOpen || !productId) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const [detail, catalogsResponse, colorsResponse] = await Promise.all([
          getProductDetail(productId),
          getCatalogs(),
          getColors(),
        ]);

        if (cancelled) return;

        setProduct(detail);
        setCatalogs(catalogsResponse);
        setColors(colorsResponse);

        setNameProduct(detail.name);
        setCatalogId(detail.catalog_id);
        // detail.price / detail.discount_value llegan como string (Decimal); se usan tal cual.
        setPriceProduct(detail.price);
        setDiscountEnable(detail.discount_enable);
        setDiscountValue(detail.discount_value);
        setStockProduct(String(detail.stock));
        setDescripcionProduct(detail.descripcion);
        setMainColorId(detail.main_color_id ?? "");
        setErrors({});

        setExistingImages(detail.images);
        setImagesToDelete(new Set());
        setSelectedMainImageId(
          detail.images.find((image) => image.is_main)?.id ?? null,
        );
        setNewImages([]);
        // Precarga las especificaciones ya asignadas al producto.
        setSpecValues(
          detail.specifications.map((spec) => ({
            specificationTemplateId: spec.specification_template_id,
            value: spec.value,
          })),
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Error cargando el producto:", error);
          setLoadError("No se pudo cargar la información del producto.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [isOpen, productId]);

  // Carga las especificaciones del catálogo; al cambiar de categoría descarta las que ya no pertenecen.
  useEffect(() => {
    let cancelled = false;

    const loadSpecifications = async () => {
      if (!catalogId) {
        setSpecTemplates([]);
        setSpecValues([]);
        return;
      }

      try {
        const templates = await getCatalogSpecifications(catalogId);

        if (cancelled) return;

        setSpecTemplates(templates);

        const templateIds = new Set(templates.map((template) => template.id));

        setSpecValues((prev) =>
          prev.filter((item) => templateIds.has(item.specificationTemplateId)),
        );
      } catch (error) {
        console.error(error);
      }
    };

    loadSpecifications();

    return () => {
      cancelled = true;
    };
  }, [catalogId]);

  // Si la principal queda entre las "a eliminar", se promueve otra (derivado en cada render, no en un efecto).
  const effectiveMainImageId = useMemo(() => {
    if (selectedMainImageId && !imagesToDelete.has(selectedMainImageId)) {
      return selectedMainImageId;
    }

    return (
      existingImages.find((image) => !imagesToDelete.has(image.id))?.id ?? null
    );
  }, [selectedMainImageId, imagesToDelete, existingImages]);

  const resetAndClose = () => {
    newImages.forEach((image) => URL.revokeObjectURL(image.preview));

    setProduct(null);
    setLoadError(null);
    setNewImages([]);
    setErrors({});
    onClose();
  };

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (!files) return;

    const added = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setNewImages((prev) => [...prev, ...added]);
    e.target.value = "";
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages((prev) => {
      const image = prev[index];
      if (image) URL.revokeObjectURL(image.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const toggleDeleteExistingImage = (imageId: string) => {
    setImagesToDelete((prev) => {
      const next = new Set(prev);
      if (next.has(imageId)) {
        next.delete(imageId);
      } else {
        next.add(imageId);
      }
      return next;
    });
  };

  const remainingExistingImagesCount = useMemo(
    () => existingImages.filter((image) => !imagesToDelete.has(image.id)).length,
    [existingImages, imagesToDelete],
  );

  const handleSubmit = async () => {
    if (!product || !productId) return;

    // La conversión a número ocurre solo aquí, al enviar. Un campo vacío = "no tocar".
    const parsedPrice = priceProduct === "" ? null : parseNumericField(priceProduct);
    const parsedStock =
      stockProduct === "" ? null : parseNumericField(stockProduct, { integer: true });
    const parsedDiscount = discountValue === "" ? null : parseNumericField(discountValue);

    const nextErrors: typeof errors = {};

    if (priceProduct !== "" && (parsedPrice === null || parsedPrice < 0)) {
      nextErrors.price = "Ingresa un precio válido (un número mayor o igual a 0).";
    }

    if (stockProduct !== "" && (parsedStock === null || parsedStock < 0)) {
      nextErrors.stock =
        "Ingresa una cantidad de stock válida (un número entero mayor o igual a 0).";
    }

    if (
      discountEnable &&
      discountValue !== "" &&
      (parsedDiscount === null || parsedDiscount < 0 || parsedDiscount > 100)
    ) {
      nextErrors.discount = "Ingresa un porcentaje de descuento válido (entre 0 y 100).";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    try {
      setSaving(true);

      const patch: UpdateProductRequest = {};

      if (nameProduct !== product.name) patch.nameProduct = nameProduct;
      if (catalogId !== product.catalog_id) patch.catalogId = catalogId;
      if (parsedPrice !== null && parsedPrice !== Number(product.price)) {
        patch.priceProduct = parsedPrice;
      }
      if (discountEnable !== product.discount_enable) {
        patch.discountEnable = discountEnable;
      }
      if (parsedDiscount !== null && parsedDiscount !== Number(product.discount_value)) {
        patch.discountValue = parsedDiscount;
      }
      if (parsedStock !== null && parsedStock !== product.stock) {
        patch.stockProduct = parsedStock;
      }
      if (descripcionProduct !== product.descripcion) {
        patch.descripcionProduct = descripcionProduct;
      }

      const originalMainColorId = product.main_color_id ?? "";
      if (mainColorId !== originalMainColorId) {
        if (mainColorId === "") {
          patch.clearMainColor = true;
        } else {
          patch.mainColorId = mainColorId;
        }
      }

      // No se envían especificaciones marcadas sin valor; solo las completadas.
      const meaningfulSpecValues = specValues.filter(
        (item) => item.value.trim() !== "",
      );

      const catalogChanged = catalogId !== product.catalog_id;
      const specsChanged =
        catalogChanged ||
        meaningfulSpecValues.length !== product.specifications.length ||
        meaningfulSpecValues.some((item) => {
          const original = product.specifications.find(
            (spec) => spec.specification_template_id === item.specificationTemplateId,
          );
          return (original?.value ?? "") !== item.value;
        });

      if (specsChanged) {
        patch.technicalSpecProduct = meaningfulSpecValues;
      }

      if (imagesToDelete.size > 0) {
        patch.imagesToDeleted = Array.from(imagesToDelete);
      }

      if (newImages.length > 0) {
        patch.imagesProduct = newImages.map((image) => image.file);
      }

      const originalMainImageId =
        product.images.find((image) => image.is_main)?.id ?? null;

      if (effectiveMainImageId && effectiveMainImageId !== originalMainImageId) {
        patch.mainImageId = effectiveMainImageId;
      }

      await updateProduct(productId, patch);

      resetAndClose();
      onSuccess();
    } catch (error) {
      console.error("Error al actualizar el producto:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6">
      <div className="w-full max-w-7xl max-h-[90vh] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-2xl font-semibold">Editar producto</h2>

          <button
            onClick={resetAndClose}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <X size={22} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-16 text-gray-500">
            <Loader2 className="animate-spin" size={20} />
            Cargando producto...
          </div>
        ) : loadError ? (
          <div className="p-16 text-center text-red-600">{loadError}</div>
        ) : product ? (
          <>
            <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-3 lg:gap-8 lg:p-8">
              <div className="space-y-8 lg:col-span-2">
                <div className="rounded-xl border border-gray-200 p-6">
                  <h3 className="mb-6 text-lg font-semibold">
                    Información del producto
                  </h3>

                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm text-gray-700">
                        Nombre
                      </label>

                      <input
                        value={nameProduct}
                        onChange={(e) => setNameProduct(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-gray-700">
                        Categoría
                      </label>

                      <select
                        value={catalogId}
                        onChange={(e) => setCatalogId(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                      >
                        {catalogs.map((catalog) => (
                          <option key={catalog.id} value={catalog.id}>
                            {catalog.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-gray-700">
                        Color principal
                      </label>

                      <div className="flex items-center gap-3">
                        <select
                          value={mainColorId}
                          onChange={(e) => setMainColorId(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                        >
                          <option value="">Sin color principal</option>

                          {colors.map((color) => (
                            <option key={color.id} value={color.id}>
                              {color.name}
                            </option>
                          ))}
                        </select>

                        {mainColorId && (
                          <span
                            className="h-9 w-9 shrink-0 rounded-full border border-gray-300"
                            style={{
                              backgroundColor: colors.find(
                                (color) => color.id === mainColorId,
                              )?.hex_color,
                            }}
                          />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm text-gray-700">
                          Precio
                        </label>

                        <input
                          type="text"
                          inputMode="numeric"
                          value={priceProduct}
                          onChange={(e) => setPriceProduct(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                        />

                        {errors.price && (
                          <p className="mt-1 text-xs text-red-600">{errors.price}</p>
                        )}
                      </div>

                      <div>
                        <label className="mb-2 block text-sm text-gray-700">
                          Stock
                        </label>

                        <input
                          type="text"
                          inputMode="numeric"
                          value={stockProduct}
                          onChange={(e) => setStockProduct(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                        />

                        {errors.stock && (
                          <p className="mt-1 text-xs text-red-600">{errors.stock}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={discountEnable}
                          onChange={(e) => {
                            setDiscountEnable(e.target.checked);
                            if (!e.target.checked) setDiscountValue("0");
                          }}
                        />
                        Producto en descuento
                      </label>

                      {discountEnable && (
                        <>
                          {/* Porcentaje (0-100), no un monto en pesos */}
                          <input
                            type="text"
                            inputMode="numeric"
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            placeholder="Porcentaje de descuento (%)"
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                          />

                          {errors.discount && (
                            <p className="mt-1 text-xs text-red-600">{errors.discount}</p>
                          )}
                        </>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-gray-700">
                        Descripción
                      </label>

                      <textarea
                        rows={6}
                        value={descripcionProduct}
                        onChange={(e) => setDescripcionProduct(e.target.value)}
                        className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-6">
                  <h3 className="mb-2 text-lg font-semibold">Imágenes</h3>

                  <p className="mb-4 text-xs text-gray-500">
                    Haz clic sobre una imagen existente para convertirla en la
                    principal.
                  </p>

                  <div className="flex flex-wrap gap-4">
                    {existingImages.map((image) => {
                      const markedForDeletion = imagesToDelete.has(image.id);

                      return (
                        <div
                          key={image.id}
                          className={`relative overflow-hidden rounded-xl border-2 transition ${
                            markedForDeletion
                              ? "border-gray-200 opacity-40"
                              : image.id === effectiveMainImageId
                                ? "border-red-600 cursor-pointer"
                                : "border-gray-200 hover:border-red-400 cursor-pointer"
                          }`}
                          onClick={() =>
                            !markedForDeletion && setSelectedMainImageId(image.id)
                          }
                        >
                          <img
                            src={image.url}
                            className="h-24 w-24 object-cover"
                          />

                          {image.id === effectiveMainImageId && !markedForDeletion && (
                            <span className="absolute bottom-1 left-1 rounded bg-red-600 px-2 py-1 text-xs text-white">
                              Principal
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDeleteExistingImage(image.id);
                            }}
                            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow hover:bg-red-700"
                          >
                            {markedForDeletion ? <Plus size={13} /> : <Trash2 size={13} />}
                          </button>
                        </div>
                      );
                    })}

                    {newImages.map((image, index) => (
                      <div
                        key={index}
                        className="relative overflow-hidden rounded-xl border-2 border-dashed border-gray-300"
                      >
                        <img
                          src={image.preview}
                          className="h-24 w-24 object-cover"
                        />

                        <span className="absolute bottom-1 left-1 rounded bg-gray-700 px-2 py-1 text-xs text-white">
                          Nueva
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(index)}
                          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow hover:bg-red-700"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-red-500"
                    >
                      <Plus />
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={handleAddImages}
                    />
                  </div>

                  {remainingExistingImagesCount === 0 && newImages.length === 0 && (
                    <p className="mt-4 text-sm text-red-600">
                      El producto se quedará sin ninguna imagen si guardas estos
                      cambios.
                    </p>
                  )}

                  {newImages.length > 0 && (
                    <p className="mt-4 text-xs text-gray-500">
                      Las imágenes nuevas se agregarán como secundarias. Podrás
                      marcarlas como principal después de guardar.
                    </p>
                  )}
                </div>

                {specTemplates.length > 0 && (
                  <div className="rounded-xl border border-gray-200 p-6">
                    <h3 className="mb-2 text-lg font-semibold">
                      Especificaciones disponibles
                    </h3>

                    <p className="mb-5 text-xs text-gray-500">
                      Estas especificaciones las administra el equipo de
                      Rehni-Market para cada categoría. Selecciona las que
                      apliquen y asigna su valor.
                    </p>

                    <SpecificationChecklist
                      templates={specTemplates}
                      values={specValues}
                      onToggle={(templateId, checked) => {
                        setSpecValues((prev) =>
                          checked
                            ? [...prev, { specificationTemplateId: templateId, value: "" }]
                            : prev.filter(
                                (item) => item.specificationTemplateId !== templateId,
                              ),
                        );
                      }}
                      onValueChange={(templateId, value) => {
                        setSpecValues((prev) =>
                          prev.map((item) =>
                            item.specificationTemplateId === templateId
                              ? { ...item, value }
                              : item,
                          ),
                        );
                      }}
                    />
                  </div>
                )}
              </div>

              <VariantsPanel productId={product.id} catalogId={product.catalog_id} />
            </div>

            <div className="flex justify-end gap-4 border-t border-gray-200 px-6 py-5">
              <button
                onClick={resetAndClose}
                className="rounded-lg border px-5 py-2"
              >
                Cancelar
              </button>

              <button
                onClick={handleSubmit}
                disabled={saving}
                className="rounded-lg bg-red-700 px-6 py-2 text-white hover:bg-red-800 disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
