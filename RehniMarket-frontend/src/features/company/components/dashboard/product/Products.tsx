
import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  ImageOff,
} from "lucide-react";

import ProductForm from "./ProductForm";
import EditProductModal from "./ProductEdit";

import {
  getMyProducts,
  changeProductStatus,
  deleteMyProduct,
} from "@/features/company/api/productService";
import { getProductsSummary } from "@/features/company/api/companyService";
import ConfirmModal from "@/shared/components/ConfirmModal";
import { useAlert } from "@/shared/components/alert/useAlert";

import type {
  MyProductResponse,
  ProductsSummaryResponse,
} from "@/features/company/types/response";

export default function Products() {
  const { showAlert } = useAlert();

  const [products, setProducts] = useState<MyProductResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const [summary, setSummary] = useState<ProductsSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [openProductModal, setOpenProductModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);

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

  // Conteos sobre toda la tabla de productos; se recargan tras cada acción que pueda cambiarlos.
  const loadSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);

      const response = await getProductsSummary();

      setSummary(response);
    } catch (error) {
      console.error("Error cargando las estadísticas de productos:", error);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadProducts();
    }, 300);

    return () => clearTimeout(timeout);
  }, [loadProducts]);

  useEffect(() => {
    // Carga inicial de las estadísticas; no usa `loadSummary` como dependencia para evitar setState síncrono.
    let cancelled = false;

    const loadInitialSummary = async () => {
      try {
        setSummaryLoading(true);

        const response = await getProductsSummary();

        if (!cancelled) {
          setSummary(response);
        }
      } catch (error) {
        console.error("Error cargando las estadísticas de productos:", error);
      } finally {
        if (!cancelled) {
          setSummaryLoading(false);
        }
      }
    };

    loadInitialSummary();

    return () => {
      cancelled = true;
    };
  }, []);

  // Crear/editar un producto puede cambiar los conteos; se refrescan ambos juntos.
  const handleProductSaved = () => {
    loadProducts();
    loadSummary();
  };

  // Tras crear el producto padre se abre su edición para definir las variantes.
  const handleProductCreated = (productId: string) => {
    loadProducts();
    loadSummary();
    setEditingProductId(productId);
    setOpenEditModal(true);
  };

  const handleChangeStatus = async (
    productId: string,
    isActive: boolean,
  ) => {
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

      loadSummary();
    } catch (error) {
      console.error(
        "Error cambiando estado del producto:",
        error,
      );
      showAlert("error", "No se pudo cambiar el estado del producto.");
    }
  };

  const handleDeleteProduct = async () => {
    if (!confirmDeleteId) return;

    try {
      setDeletingProduct(true);

      await deleteMyProduct(confirmDeleteId);

      // Eliminación lógica (is_active=false + deleted_at). Se saca de la lista en memoria;
      // al recargar aparece con el badge "Eliminado".
      setProducts((prev) =>
        prev.filter((product) => product.id !== confirmDeleteId),
      );

      showAlert("success", "Producto eliminado correctamente.");

      loadSummary();
    } catch (error) {
      console.error(
        "Error eliminando producto:",
        error,
      );
      showAlert("error", "No se pudo eliminar el producto.");
    } finally {
      setDeletingProduct(false);
      setConfirmDeleteId(null);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Productos
          </h1>

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

      <section className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4">
        <StatsCard
          title="Productos publicados"
          value={summaryLoading ? "..." : String(summary?.total ?? 0)}
        />

        <StatsCard
          title="Activos"
          value={summaryLoading ? "..." : String(summary?.active ?? 0)}
        />

        <StatsCard
          title="Agotados"
          value={summaryLoading ? "..." : String(summary?.out_of_stock ?? 0)}
        />

        <StatsCard
          title="Ocultos"
          value={summaryLoading ? "..." : String(summary?.hidden ?? 0)}
        />
      </section>

      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold">
          Lista de productos
        </h2>

        <div className="mt-6 flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
          <Search
            size={20}
            className="text-gray-400"
          />

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
              <p className="py-5 text-center text-gray-500">
                Cargando productos...
              </p>
            ) : products.length === 0 ? (
              <p className="py-5 text-center text-gray-500">
                No se encontraron productos.
              </p>
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-2xl border border-gray-200 p-5 transition hover:shadow-md"
                >
                  <div className="flex items-center gap-5">
                    {/* Imagen inicial = primera variante viva (la resuelve el backend). */}
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-20 w-20 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-300">
                        <ImageOff size={22} />
                      </div>
                    )}

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
                            product.deleted_at
                              ? "bg-red-100 text-red-700"
                              : product.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {product.deleted_at
                            ? "Eliminado"
                            : product.is_active
                              ? "Activo"
                              : "Inactivo"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!product.deleted_at && (
                      <button
                        onClick={() =>
                          handleChangeStatus(
                            product.id,
                            !product.is_active,
                          )
                        }
                        className="rounded-xl p-3 hover:bg-gray-100"
                        title={
                          product.is_active
                            ? "Desactivar producto"
                            : "Activar producto"
                        }
                      >
                        <Eye size={18} />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setEditingProductId(product.id);
                        setOpenEditModal(true);
                      }}
                      className="rounded-xl p-3 hover:bg-gray-100"
                      title="Editar producto"
                    >
                      <Pencil size={18} />
                    </button>

                    {!product.deleted_at && (
                      <button
                        onClick={() => setConfirmDeleteId(product.id)}
                        className="rounded-xl p-3 text-red-700 hover:bg-red-50"
                        title="Eliminar producto"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-5">
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
        onSuccess={handleProductCreated}
      />

      <EditProductModal
        isOpen={openEditModal}
        productId={editingProductId}
        onClose={() => {
          setOpenEditModal(false);
          setEditingProductId(null);
        }}
        onSuccess={handleProductSaved}
      />

      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        title="Eliminar producto"
        message="¿Eliminar este producto? Dejará de estar visible en el catálogo público, pero podrás reactivarlo cambiando su estado a Activo."
        confirmLabel="Eliminar"
        loading={deletingProduct}
        onConfirm={handleDeleteProduct}
        onClose={() => setConfirmDeleteId(null)}
      />
    </>
  );
}

function StatsCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-500">
        {title}
      </p>

      <h3 className="mt-3 text-3xl font-bold">
        {value}
      </h3>
    </div>
  );
}

