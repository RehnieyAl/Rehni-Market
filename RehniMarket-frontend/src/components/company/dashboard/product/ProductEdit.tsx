import { X, Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import EditVariantModal from "./ProductAddVariant";
interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProductModal({
  isOpen,
  onClose,
}: EditProductModalProps) {
  const [openVariantModal, setOpenVariantModal] = useState(false);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="w-full max-w-7xl rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-2xl font-semibold">Editar producto</h2>

          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <X size={22} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-8 p-8">
          <div className="col-span-2 rounded-xl border border-gray-200 p-6">
            <h3 className="mb-6 text-lg font-semibold">
              Información del producto
            </h3>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm text-gray-700">
                  Nombre
                </label>

                <input
                  defaultValue="Laptop Gamer ASUS TUF"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-700">
                  Categoría
                </label>

                <select className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500">
                  <option>Laptops</option>
                  <option>Monitores</option>
                  <option>Accesorios</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="mb-2 block text-sm text-gray-700">
                    Precio
                  </label>

                  <input
                    defaultValue="2500000"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-700">
                    Stock
                  </label>

                  <input
                    defaultValue="15"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-700">
                  Descripción
                </label>

                <textarea
                  rows={6}
                  defaultValue="Laptop gamer con RTX 4060, Ryzen 7 y 16GB de RAM."
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Variantes</h3>

              <button
                onClick={() => setOpenVariantModal(true)}
                className="flex items-center gap-2 rounded-lg bg-red-700 px-3 py-2 text-white hover:bg-red-800"
              >
                <Plus size={18} />
                Agregar
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 p-4 hover:border-red-500 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Negro</h4>

                    <p className="text-sm text-gray-500">Color principal</p>
                  </div>

                  <div className="flex gap-2">
                    <button className="rounded-lg p-2 hover:bg-gray-100">
                      <Pencil size={18} />
                    </button>

                    <button className="rounded-lg p-2 text-red-600 hover:bg-red-50">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Precio</span>

                    <p className="font-semibold">$2.500.000</p>
                  </div>

                  <div>
                    <span className="text-gray-500">Stock</span>

                    <p className="font-semibold">12</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <img
                    src="https://via.placeholder.com/70"
                    className="h-16 w-16 rounded-lg object-cover"
                  />

                  <img
                    src="https://via.placeholder.com/70"
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-gray-300 p-5 text-center text-gray-400">
                No hay más variantes
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 border-t border-gray-200 px-6 py-5">
          <button onClick={onClose} className="rounded-lg border px-5 py-2">
            Cancelar
          </button>

          <button className="rounded-lg bg-red-700 px-6 py-2 text-white hover:bg-red-800">
            Guardar cambios
          </button>
        </div>
      </div>
      <EditVariantModal
        isOpen={openVariantModal}
        onClose={() => setOpenVariantModal(false)}
      />
    </div>
  );
}
