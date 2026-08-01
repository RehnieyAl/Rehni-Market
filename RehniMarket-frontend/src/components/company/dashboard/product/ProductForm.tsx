import { X, Upload, Plus } from "lucide-react";
import type {
  CreateProductRequest,
  CatalogResponse,
  SpecificationResponse,
} from "../../../../types/company";
import {
  createProduct,
  getCatalogs,
  getCatalogSpecifications,
} from "../../../../services/companyService";

import { useState, useEffect, useRef } from "react";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProductForm({ isOpen, onClose, onSuccess }: ProductModalProps) {
  const [catalogs, setCatalogs] = useState<CatalogResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [specifications, setSpecifications] = useState<SpecificationResponse[]>(
    [],
  );
  const [product, setProduct] = useState<CreateProductRequest>({
    nameProduct: "",
    catalogId: "",
    priceProduct: "",
    stockProduct: "",
    descripcionProduct: "",
    technicalSpecProduct: [],
    imagesProduct: [],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resetProduct = () => {
    product.imagesProduct.forEach((image) => {
      URL.revokeObjectURL(image.preview);
    });

    setProduct({
      nameProduct: "",
      catalogId: "",
      priceProduct: "",
      stockProduct: "",
      descripcionProduct: "",
      technicalSpecProduct: [],
      imagesProduct: [],
    });

    setSpecifications([]);
  };

  const handleClose = () => {
    resetProduct();
    onClose();
  };
  const handleSubmit = async () => {
    try {
      setLoading(true);

      await createProduct(product);
      
      resetProduct();
      onClose();
      onSuccess();
    } catch (error) {
      console.error("Error al crear el producto:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const response = await getCatalogs();
        setCatalogs(response);
      } catch (error) {
        console.error(error);
      }
    };

    loadCatalogs();
  }, []);

  useEffect(() => {
    if (!product.catalogId) {
      return;
    }

    let cancelled = false;

    const loadSpecifications = async () => {
      try {
        const response = await getCatalogSpecifications(product.catalogId);

        if (!cancelled) {
          setSpecifications(response);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadSpecifications();

    return () => {
      cancelled = true;
    };
  }, [product.catalogId]);

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (!files) return;

    setProduct((prev) => {
      const newImages = Array.from(files).map((file, index) => ({
        file,
        preview: URL.createObjectURL(file),
        isMain: prev.imagesProduct.length === 0 && index === 0,
      }));

      return {
        ...prev,
        imagesProduct: [...prev.imagesProduct, ...newImages],
      };
    });

    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setProduct((prev) => {
      const image = prev.imagesProduct[index];

      if (image) {
        URL.revokeObjectURL(image.preview);
      }

      const images = prev.imagesProduct.filter((_, i) => i !== index);

      if (images.length > 0 && !images.some((image) => image.isMain)) {
        images[0].isMain = true;
      }

      return {
        ...prev,
        imagesProduct: images,
      };
    });
  };

  const handleSetMainImage = (index: number) => {
    setProduct((prev) => ({
      ...prev,
      imagesProduct: prev.imagesProduct.map((image, i) => ({
        ...image,
        isMain: i === index,
      })),
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-gray-200 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Crear nuevo producto
          </h2>

          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-900 transition"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Información básica
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
                    setProduct({
                      ...product,
                      nameProduct: e.target.value,
                    })
                  }
                  className="w-full rounded-lg bg-white border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Categoría
                </label>

                <select
                  value={product.catalogId}
                  onChange={(e) => {
                    const catalogId = e.target.value;

                    setProduct({
                      ...product,
                      catalogId,
                      technicalSpecProduct: [],
                    });

                    setSpecifications([]);
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

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Precio
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    value={product.priceProduct}
                    onChange={(e) =>
                      setProduct({
                        ...product,
                        priceProduct:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    className="w-full appearance-none rounded-lg bg-white border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Stock
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    value={product.stockProduct}
                    onChange={(e) =>
                      setProduct({
                        ...product,
                        stockProduct:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    className="w-full appearance-none rounded-lg bg-white border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Descripción
                </label>

                <textarea
                  rows={5}
                  value={product.descripcionProduct}
                  onChange={(e) =>
                    setProduct({
                      ...product,
                      descripcionProduct: e.target.value,
                    })
                  }
                  className="w-full rounded-lg bg-white border border-gray-300 px-4 py-3 text-gray-900 resize-none outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Imágenes
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-700 mb-3">
                  Imagen principal
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleImages}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-40 h-40 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:border-red-500 hover:text-red-500 transition"
                >
                  <Upload size={28} />

                  <span className="text-sm mt-3">Subir imagen</span>
                </button>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-3">
                  Galería
                </label>

                <div className="flex gap-4 flex-wrap">
                  {product.imagesProduct.map((image, index) => (
                    <div
                      key={index}
                      className="relative cursor-pointer"
                      onClick={() => handleSetMainImage(index)}
                    >
                      <img
                        src={image.preview}
                        className="w-28 h-28 rounded-xl object-cover"
                      />

                      {image.isMain && (
                        <span className="absolute bottom-1 left-1 bg-red-600 text-white text-xs px-2 py-1 rounded">
                          Principal
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-28 h-28 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 hover:border-red-500"
                  >
                    <Plus />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Especificaciones técnicas
            </h3>

            <p className="text-sm text-gray-500 mb-5">
              Estas especificaciones cambiarán automáticamente según la
              categoría seleccionada.
            </p>

            <div className="grid grid-cols-2 gap-5">
              {specifications.map((specification) => (
                <div key={specification.id}>
                  <label className="block text-sm text-gray-700 mb-2">
                    {specification.name}

                    {specification.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>

                  <input
                    type="text"
                    value={
                      product.technicalSpecProduct.find(
                        (item) =>
                          item.specificationTemplateId === specification.id,
                      )?.value || ""
                    }
                    onChange={(e) => {
                      const value = e.target.value;

                      setProduct((prev) => {
                        const technicalSpecProduct = [
                          ...prev.technicalSpecProduct,
                        ];

                        const index = technicalSpecProduct.findIndex(
                          (item) =>
                            item.specificationTemplateId === specification.id,
                        );

                        if (index >= 0) {
                          technicalSpecProduct[index] = {
                            ...technicalSpecProduct[index],
                            value,
                          };
                        } else {
                          technicalSpecProduct.push({
                            specificationTemplateId: specification.id,
                            value,
                          });
                        }

                        return {
                          ...prev,
                          technicalSpecProduct,
                        };
                      });
                    }}
                    className="w-full rounded-lg bg-white border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />
                </div>
              ))}
            </div>
          </section>
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
            {loading ? "Guardando..." : "Guardar producto"}
          </button>
        </div>
      </div>
    </div>
  );
}
