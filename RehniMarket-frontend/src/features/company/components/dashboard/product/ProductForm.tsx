import { X } from "lucide-react";
import { useState, useEffect } from "react";

import type { CreateProductRequest } from "@/features/company/types/request";
import type { CatalogResponse } from "@/features/company/types/response";
import type {
  AttributeValueInput,
  CatalogAttribute,
} from "@/features/company/types/catalogAttributes";

import { createProduct } from "@/features/company/api/productService";
import { getCatalogs, getCatalogAttributes } from "@/features/company/api/catalogService";

import AttributeValueFields from "./AttributeValueFields";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (productId: string) => void;
}

const emptyProduct = (): CreateProductRequest => ({
  nameProduct: "",
  catalogId: "",
  descripcionProduct: "",
  productAttributes: [],
});

export default function ProductForm({ isOpen, onClose, onSuccess }: ProductModalProps) {
  const [catalogs, setCatalogs] = useState<CatalogResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [productAttributes, setProductAttributes] = useState<CatalogAttribute[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<CreateProductRequest>(emptyProduct);

  const resetProduct = () => {
    setProduct(emptyProduct());
    setProductAttributes([]);
    setError(null);
  };

  const handleClose = () => {
    resetProduct();
    onClose();
  };

  const setAttributeValue = (attributeId: string, value: string) => {
    setProduct((prev) => {
      const rest = prev.productAttributes.filter(
        (item) => item.attributeId !== attributeId,
      );
      const next: AttributeValueInput[] = value
        ? [...rest, { attributeId, value }]
        : rest;
      return { ...prev, productAttributes: next };
    });
  };

  const handleSubmit = async () => {
    if (!product.nameProduct.trim() || !product.catalogId || !product.descripcionProduct.trim()) {
      setError("Completa nombre, categoría y descripción.");
      return;
    }

    setError(null);

    try {
      setLoading(true);
      const created = await createProduct(product);
      resetProduct();
      onClose();
      onSuccess(created.product_id);
    } catch (submitError) {
      console.error("Error al crear el producto:", submitError);
      setError("No se pudo crear el producto. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCatalogs()
      .then(setCatalogs)
      .catch((catalogError) => console.error(catalogError));
  }, []);

  useEffect(() => {
    if (!product.catalogId) return;

    let cancelled = false;

    getCatalogAttributes(product.catalogId)
      .then((response) => {
        if (!cancelled) setProductAttributes(response.product_attributes);
      })
      .catch((attrError) => console.error(attrError));

    return () => {
      cancelled = true;
    };
  }, [product.catalogId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-200 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">Crear nuevo producto</h2>

          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-900 transition"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
            El producto es solo la identidad del artículo. El precio, el stock, el SKU, el
            descuento y las imágenes se definen en cada variante, en el siguiente paso.
          </p>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Información del producto
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Nombre del producto
                </label>

                <input
                  type="text"
                  value={product.nameProduct}
                  onChange={(e) =>
                    setProduct({ ...product, nameProduct: e.target.value })
                  }
                  className="w-full rounded-lg bg-white border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Categoría</label>

                <select
                  value={product.catalogId}
                  onChange={(e) => {
                    setProduct({
                      ...product,
                      catalogId: e.target.value,
                      productAttributes: [],
                    });
                    if (!e.target.value) setProductAttributes([]);
                  }}
                  className="w-full rounded-lg bg-white border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                >
                  <option value="">Seleccione una categoría</option>

                  {catalogs.map((catalog) => (
                    <option key={catalog.id} value={catalog.id}>
                      {catalog.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Descripción</label>

                <textarea
                  rows={5}
                  value={product.descripcionProduct}
                  onChange={(e) =>
                    setProduct({ ...product, descripcionProduct: e.target.value })
                  }
                  className="w-full rounded-lg bg-white border border-gray-300 px-4 py-3 text-gray-900 resize-none outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Especificaciones del producto
            </h3>

            <p className="text-sm text-gray-500 mb-5">
              Información común a todas las variantes (Marca, Modelo, Procesador…). Los
              atributos de cada categoría los administra el equipo de Rehni-Market.
            </p>

            <AttributeValueFields
              attributes={productAttributes}
              values={product.productAttributes}
              onChange={setAttributeValue}
            />
          </section>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="border-t border-gray-200 px-6 py-5 flex justify-end gap-4">
          <button
            onClick={handleClose}
            className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear y agregar variantes"}
          </button>
        </div>
      </div>
    </div>
  );
}
