/** Modal "Crear nuevo producto" del panel de empresa: identidad, categoría, IVA y especificaciones; las
 * imágenes van en las variantes (siguiente paso), con la plantilla descargable desde aquí. */
import { ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";

import type { CreateProductRequest } from "@/features/company/types/request";
import type { CatalogResponse } from "@/features/company/types/response";
import type {
  AttributeValueInput,
  CatalogAttribute,
} from "@/features/company/types/catalogAttributes";

import { createProduct } from "@/features/company/api/productService";
import { getCatalogs, getCatalogAttributes } from "@/features/company/api/catalogService";

import { Button, Input, Modal, Select, Textarea } from "@/shared/components/ui";

import AttributeValueFields from "./AttributeValueFields";
import ProductImageTemplateButton, { PRODUCT_IMAGE_HINT } from "./ProductImageTemplateButton";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (productId: string) => void;
}

const emptyProduct = (): CreateProductRequest => ({
  nameProduct: "",
  catalogId: "",
  descripcionProduct: "",
  appliesTax: true,
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Crear nuevo producto"
      size="lg"
      busy={loading}
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Crear y agregar variantes
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 rounded-control border border-hairline bg-surface-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <ImageIcon size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-secondary" />
            <div className="text-sm">
              <p className="text-ink">
                El producto es solo la identidad del artículo. El precio, el stock, el SKU, el descuento y
                las imágenes se definen en cada variante, en el siguiente paso.
              </p>
              <p className="mt-1 text-xs text-ink-muted">Imágenes: {PRODUCT_IMAGE_HINT}</p>
            </div>
          </div>
          <div className="shrink-0">
            <ProductImageTemplateButton />
          </div>
        </div>

        <section aria-labelledby="product-info-title" className="space-y-4">
          <h3 id="product-info-title" className="text-base font-semibold text-ink">
            Información del producto
          </h3>

          <Input
            label="Nombre del producto"
            value={product.nameProduct}
            onChange={(e) => setProduct({ ...product, nameProduct: e.target.value })}
          />

          <Select
            label="Categoría"
            value={product.catalogId}
            onChange={(e) => {
              setProduct({ ...product, catalogId: e.target.value, productAttributes: [] });
              if (!e.target.value) setProductAttributes([]);
            }}
          >
            <option value="">Seleccione una categoría</option>
            {catalogs.map((catalog) => (
              <option key={catalog.id} value={catalog.id}>
                {catalog.name}
              </option>
            ))}
          </Select>

          <Textarea
            label="Descripción"
            rows={5}
            value={product.descripcionProduct}
            onChange={(e) => setProduct({ ...product, descripcionProduct: e.target.value })}
          />

          <label className="flex cursor-pointer items-start gap-3 rounded-control border border-hairline bg-surface-2 px-4 py-3">
            <input
              type="checkbox"
              checked={product.appliesTax}
              onChange={(e) => setProduct({ ...product, appliesTax: e.target.checked })}
              className="mt-0.5 h-4 w-4 accent-secondary"
            />
            <span className="text-sm text-ink">
              Este producto aplica IVA (19%)
              <span className="mt-0.5 block text-xs text-ink-muted">
                Si lo activas, el comprador verá el IVA en el detalle y se sumará al pagar. Si no aplica,
                déjalo sin marcar.
              </span>
            </span>
          </label>
        </section>

        <section aria-labelledby="product-specs-title" className="space-y-3">
          <div>
            <h3 id="product-specs-title" className="text-base font-semibold text-ink">
              Especificaciones del producto
            </h3>
            <p className="mt-1 text-sm text-ink-muted">
              Información común a todas las variantes (Marca, Modelo, Procesador…). Los atributos de cada
              categoría los administra el equipo de Rehni-Market.
            </p>
          </div>

          <AttributeValueFields
            attributes={productAttributes}
            values={product.productAttributes}
            onChange={setAttributeValue}
          />
        </section>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
