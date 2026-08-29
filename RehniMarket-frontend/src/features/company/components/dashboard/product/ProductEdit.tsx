import { X, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { getProductDetail, updateProduct } from "@/features/company/api/productService";
import { getCatalogs, getCatalogAttributes } from "@/features/company/api/catalogService";

import VariantsPanel from "./VariantsPanel";
import AttributeValueFields from "./AttributeValueFields";

import type { UpdateProductRequest } from "@/features/company/types/request";
import type {
  CatalogResponse,
  ProductDetailResponse,
} from "@/features/company/types/response";
import type {
  AttributeValueInput,
  CatalogAttribute,
} from "@/features/company/types/catalogAttributes";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
  onSuccess: () => void;
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
  const [saveError, setSaveError] = useState<string | null>(null);

  const [product, setProduct] = useState<ProductDetailResponse | null>(null);
  const [catalogs, setCatalogs] = useState<CatalogResponse[]>([]);
  const [productAttributes, setProductAttributes] = useState<CatalogAttribute[]>([]);
  const [attributeValues, setAttributeValues] = useState<AttributeValueInput[]>([]);

  const [nameProduct, setNameProduct] = useState("");
  const [catalogId, setCatalogId] = useState("");
  const [descripcionProduct, setDescripcionProduct] = useState("");

  useEffect(() => {
    if (!isOpen || !productId) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        setSaveError(null);

        const [detail, catalogsResponse] = await Promise.all([
          getProductDetail(productId),
          getCatalogs(),
        ]);

        if (cancelled) return;

        setProduct(detail);
        setCatalogs(catalogsResponse);

        setNameProduct(detail.name);
        setCatalogId(detail.catalog_id);
        setDescripcionProduct(detail.descripcion);

        setAttributeValues(
          detail.attributes.map((pair) => ({
            attributeId: pair.attribute_id,
            value: pair.value,
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

  useEffect(() => {
    if (!catalogId) return;

    let cancelled = false;

    getCatalogAttributes(catalogId)
      .then((response) => {
        if (cancelled) return;
        setProductAttributes(response.product_attributes);

        const allowed = new Set(response.product_attributes.map((a) => a.id));
        setAttributeValues((prev) => prev.filter((item) => allowed.has(item.attributeId)));
      })
      .catch((error) => console.error(error));

    return () => {
      cancelled = true;
    };
  }, [catalogId]);

  const resetAndClose = () => {
    setProduct(null);
    setLoadError(null);
    setSaveError(null);
    onClose();
  };

  const setAttributeValue = (attributeId: string, value: string) => {
    setAttributeValues((prev) => {
      const rest = prev.filter((item) => item.attributeId !== attributeId);
      return value ? [...rest, { attributeId, value }] : rest;
    });
  };

  const attributesChanged = (original: ProductDetailResponse) => {
    const meaningful = attributeValues.filter((item) => item.value.trim() !== "");
    if (meaningful.length !== original.attributes.length) return true;
    return meaningful.some((item) => {
      const before = original.attributes.find((a) => a.attribute_id === item.attributeId);
      return (before?.value ?? "") !== item.value.trim();
    });
  };

  const handleSubmit = async () => {
    if (!product || !productId) return;

    if (!nameProduct.trim() || !catalogId || !descripcionProduct.trim()) {
      setSaveError("Completa nombre, categoría y descripción.");
      return;
    }

    setSaveError(null);

    try {
      setSaving(true);

      const patch: UpdateProductRequest = {};

      if (nameProduct !== product.name) patch.nameProduct = nameProduct;
      if (catalogId !== product.catalog_id) patch.catalogId = catalogId;
      if (descripcionProduct !== product.descripcion) {
        patch.descripcionProduct = descripcionProduct;
      }
      if (catalogId !== product.catalog_id || attributesChanged(product)) {
        patch.productAttributes = attributeValues.filter((item) => item.value.trim() !== "");
      }

      if (Object.keys(patch).length > 0) {
        await updateProduct(productId, patch);
      }

      resetAndClose();
      onSuccess();
    } catch (error) {
      console.error("Error al actualizar el producto:", error);
      setSaveError("No se pudieron guardar los cambios. Revisa los datos e intenta de nuevo.");
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

          <button onClick={resetAndClose} className="rounded-lg p-2 hover:bg-gray-100">
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
                <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  Aquí se edita solo la identidad del producto. El precio, el stock, el SKU,
                  el descuento y las imágenes se administran en cada variante.
                </p>

                <div className="rounded-xl border border-gray-200 p-6">
                  <h3 className="mb-6 text-lg font-semibold">Información del producto</h3>

                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm text-gray-700">Nombre</label>
                      <input
                        value={nameProduct}
                        onChange={(e) => setNameProduct(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-gray-700">Categoría</label>
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
                      <label className="mb-2 block text-sm text-gray-700">Descripción</label>
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
                  <h3 className="mb-2 text-lg font-semibold">Especificaciones del producto</h3>
                  <p className="mb-5 text-xs text-gray-500">
                    Información común a todas las variantes. Los atributos de cada categoría
                    los administra el equipo de Rehni-Market.
                  </p>

                  <AttributeValueFields
                    attributes={productAttributes}
                    values={attributeValues}
                    onChange={setAttributeValue}
                  />
                </div>
              </div>

              <VariantsPanel productId={product.id} catalogId={product.catalog_id} />
            </div>

            <div className="flex flex-col gap-2 border-t border-gray-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
              {saveError && (
                <p className="text-sm text-red-600 sm:mr-auto">{saveError}</p>
              )}

              <button onClick={resetAndClose} className="rounded-lg border px-5 py-2">
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
