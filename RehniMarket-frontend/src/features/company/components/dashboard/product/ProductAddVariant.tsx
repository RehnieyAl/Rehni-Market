import { useRef, useState } from "react";
import { X, Upload, Trash2 } from "lucide-react";

interface EditVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface VariantImage {
  file: File;
  preview: string;
  isMain: boolean;
}

export default function EditVariantModal({
  isOpen,
  onClose,
}: EditVariantModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [variant, setVariant] = useState({
    colorId: "",
    price: "",
    stock: "",
    images: [] as VariantImage[],
  });

  const [loading, setLoading] = useState(false);

  const colors = [
    { id: "1", name: "Negro" },
    { id: "2", name: "Blanco" },
    { id: "3", name: "Rojo" },
    { id: "4", name: "Azul" },
  ];

  const resetVariant = () => {
    variant.images.forEach((image) => URL.revokeObjectURL(image.preview));

    setVariant({
      colorId: "",
      price: "",
      stock: "",
      images: [],
    });
  };

  const handleClose = () => {
    resetVariant();
    onClose();
  };

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (!files) return;

    setVariant((prev) => {
      const newImages = Array.from(files).map((file, index) => ({
        file,
        preview: URL.createObjectURL(file),
        isMain: prev.images.length === 0 && index === 0,
      }));

      return {
        ...prev,
        images: [...prev.images, ...newImages],
      };
    });

    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setVariant((prev) => {
      const image = prev.images[index];

      if (image) {
        URL.revokeObjectURL(image.preview);
      }

      const images = prev.images.filter((_, i) => i !== index);

      if (images.length > 0 && !images.some((img) => img.isMain)) {
        images[0].isMain = true;
      }

      return {
        ...prev,
        images,
      };
    });
  };

  const setMainImage = (index: number) => {
    setVariant((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        isMain: i === index,
      })),
    }));
  };

  const handleSubmit = async () => {
    if (!variant.colorId) {
      alert("Seleccione un color");
      return;
    }

    if (!variant.price || Number(variant.price) <= 0) {
      alert("Ingrese un precio válido");
      return;
    }

    if (!variant.stock || Number(variant.stock) < 0) {
      alert("Ingrese un stock válido");
      return;
    }

    if (variant.images.length === 0) {
      alert("Debe agregar al menos una imagen");
      return;
    }

    try {
      setLoading(true);

      console.log(variant);

      // await createVariant(...)

      handleClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const mainImage = variant.images.find((image) => image.isMain);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6">
      <div className="w-full max-w-3xl rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold">Agregar variante</h2>

          <button
            onClick={handleClose}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div>
            <label className="mb-2 block text-sm text-gray-700">Color</label>

            <select
              value={variant.colorId}
              onChange={(e) =>
                setVariant({
                  ...variant,
                  colorId: e.target.value,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
            >
              <option value="">Seleccione un color</option>

              {colors.map((color) => (
                <option key={color.id} value={color.id}>
                  {color.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="mb-2 block text-sm text-gray-700">Precio</label>

              <input
                type="number"
                value={variant.price}
                onChange={(e) =>
                  setVariant({
                    ...variant,
                    price: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-700">Stock</label>

              <input
                type="number"
                value={variant.stock}
                onChange={(e) =>
                  setVariant({
                    ...variant,
                    stock: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-gray-700">
              Imagen principal
            </label>

            <div className="mb-6 flex justify-center">
              {mainImage ? (
                <img
                  src={mainImage.preview}
                  alt="Imagen principal"
                  className="h-64 w-64 rounded-xl border border-gray-300 object-cover"
                />
              ) : (
                <div className="flex h-64 w-64 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-gray-400">
                  Sin imagen
                </div>
              )}
            </div>

            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Galería
              </label>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:border-red-500 hover:text-red-600"
              >
                <Upload size={18} />
                Agregar imágenes
              </button>
            </div>

            <p className="mb-4 text-xs text-gray-500">
              Haz clic sobre una imagen para convertirla en la imagen principal.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              hidden
              multiple
              accept="image/*"
              onChange={handleImages}
            />

            <div className="flex flex-wrap gap-4">
              {variant.images.map((image, index) => (
                <div
                  key={index}
                  onClick={() => setMainImage(index)}
                  className={`relative cursor-pointer overflow-hidden rounded-xl border-2 transition ${
                    image.isMain
                      ? "border-red-600"
                      : "border-gray-200 hover:border-red-400"
                  }`}
                >
                  <img
                    src={image.preview}
                    alt={`Imagen ${index + 1}`}
                    className="h-24 w-24 object-cover"
                  />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow hover:bg-red-700"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              {variant.images.length === 0 && (
                <div className="flex h-24 w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-400">
                  No has agregado imágenes.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 border-t border-gray-200 px-6 py-5">
          <button
            onClick={handleClose}
            className="rounded-lg border border-gray-300 px-5 py-2 hover:bg-gray-100"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-red-700 px-6 py-2 text-white hover:bg-red-800 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar variante"}
          </button>
        </div>
      </div>
    </div>
  );
}
