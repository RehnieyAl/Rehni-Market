import { Plus, Search, Eye, Pencil, Trash2, Package } from "lucide-react";
import ProductForm from "./ProductForm";
import {
  getMyProducts,
  changeProductStatus,
  deleteMyProduct,
} from "../../../../services/companyService";
import type { MyProductResponse } from "../../../../types/company";
import { useEffect, useState, useCallback } from "react";
import EditProductModal from "./ProductEdit";

export default function Products() {
  const [products, setProducts] = useState<MyProductResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openProductModal, setOpenProductModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);

      const response = await getMyProducts(page, 5, search);
      setProducts(response.products);
      setTotalPages(response.total_pages);
    } catch (error) {
      console.error("Error cargando productos:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadProducts();
    }, 300);

    return () => clearTimeout(timeout);
  }, [loadProducts]);

  const handleChangeStatus = async (productId: string, isActive: boolean) => {
    try {
      await changeProductStatus(productId, {
        is_active: isActive,
      });

      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId
            ? {
                ...product,
                is_active: isActive,
              }
            : product,
        ),
      );
    } catch (error) {
      console.error("Error cambiando estado del producto:", error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteMyProduct(productId);

      setProducts((prev) => prev.filter((product) => product.id !== productId));
    } catch (error) {
      console.error("Error eliminando producto:", error);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
          <p className="mt-2 text-gray-500">
            Administra todos los productos de tu empresa.
          </p>
        </div>

        <button
          onClick={() => setOpenProductModal(true)}
          className="flex items-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-white hover:bg-red-800"
        >
          <Plus size={18} />
          Nuevo producto
        </button>
      </div>

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        <StatsCard title="Productos" value="proximanente" />
        <StatsCard title="Publicados" value="proximamente" />
        <StatsCard title="Stock bajo" value="proximamente" />
      </section>

      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold">Lista de productos</h2>

        <div className="mt-6 flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
          <Search size={20} className="text-gray-400" />

          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar producto..."
            className="w-full outline-none"
          />
        </div>

        <div className="mt-8 max-h-[600px] overflow-y-auto pr-2">
          <div className="grid gap-5">
            {loading ? (
              <p className="text-center text-gray-500 py-5">
                Cargando productos...
              </p>
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-2xl border border-gray-200 p-5 hover:shadow-md transition"
                >
                  <div className="flex items-center gap-5">
                    <img
                      src={product.image ?? "https://via.placeholder.com/100"}
                      className="h-20 w-20 rounded-xl object-cover"
                    />

                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {product.name}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {product.description}
                      </p>

                      <div className="mt-3 flex gap-4 text-sm">
                        <span className="text-gray-600">
                          {product.category}
                        </span>

                        <span className="font-semibold text-gray-900">
                          ${product.price.toLocaleString()}
                        </span>

                        <span className="text-gray-600">
                          Stock: {product.stock}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs ${
                            product.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {product.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleChangeStatus(product.id, !product.is_active)
                      }
                      className="rounded-xl p-3 hover:bg-gray-100"
                    >
                      <Eye size={18} />
                    </button>

                    <button
                      onClick={() => setOpenEditModal(true)}
                      className="rounded-xl p-3 hover:bg-gray-100"
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="rounded-xl p-3 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-5 mt-8">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="rounded-xl border px-4 py-2 disabled:opacity-50"
          >
            Anterior
          </button>

          <span className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded-xl border px-4 py-2 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </section>

      <ProductForm
        isOpen={openProductModal}
        onClose={() => setOpenProductModal(false)}
        onSuccess={loadProducts}
      />

      <EditProductModal
        isOpen={openEditModal}
        onClose={() => setOpenEditModal(false)}
      />
    </>
  );
}

function StatsCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{title}</p>
        <Package size={22} className="text-red-700" />
      </div>

      <h3 className="mt-3 text-3xl font-bold">{value}</h3>
    </div>
  );
}
