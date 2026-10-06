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
import { Badge, Button, EmptyState, Input, Skeleton } from "@/shared/components/ui";
import StatCard from "@/shared/components/dashboard/StatCard";

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

  const handleProductSaved = () => {
    loadProducts();
    loadSummary();
  };

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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Productos</h1>

          <p className="mt-1 text-sm text-gray-500">
            Administra todos los productos de tu empresa.
          </p>
        </div>

        <Button leadingIcon={<Plus size={18} />} onClick={() => setOpenProductModal(true)}>
          Nuevo producto
        </Button>
      </div>

      <section className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          size="sm"
          title="Productos publicados"
          value={summaryLoading ? "…" : String(summary?.total ?? 0)}
        />

        <StatCard
          size="sm"
          title="Activos"
          value={summaryLoading ? "…" : String(summary?.active ?? 0)}
        />

        <StatCard
          size="sm"
          title="Agotados"
          value={summaryLoading ? "…" : String(summary?.out_of_stock ?? 0)}
        />

        <StatCard
          size="sm"
          title="Ocultos"
          value={summaryLoading ? "…" : String(summary?.hidden ?? 0)}
        />
      </section>

      <section className="mt-8 rounded-card border border-gray-200 bg-surface-1 p-6 shadow-card sm:p-8">
        <h2 className="text-lg font-semibold text-gray-900">Lista de productos</h2>

        <Input
          className="mt-6"
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar producto…"
          aria-label="Buscar producto"
          leadingIcon={<Search size={16} />}
        />

        <div className="mt-8 max-h-[600px] overflow-y-auto pr-2">
          <div className="grid gap-5">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-28 rounded-card" />
              ))
            ) : products.length === 0 ? (
              <EmptyState
                variant="plain"
                title="No se encontraron productos"
                description="Ajusta la búsqueda o crea un producto nuevo."
              />
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-gray-200 p-5 shadow-card transition hover:shadow-pop"
                >
                  <div className="flex min-w-0 items-center gap-5">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-20 w-20 shrink-0 rounded-control object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-control border border-dashed border-gray-300 text-gray-300">
                        <ImageOff size={22} />
                      </div>
                    )}

                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900">
                        {product.name}
                      </h3>

                      <p className="line-clamp-1 text-sm text-gray-500">
                        {product.description}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        <span className="text-gray-600">
                          {product.category}
                        </span>

                        <span className="font-semibold text-gray-900">
                          ${product.price.toLocaleString()}
                        </span>

                        <span className="text-gray-600">
                          Stock: {product.stock}
                        </span>

                        <Badge
                          tone={
                            product.deleted_at
                              ? "danger"
                              : product.is_active
                                ? "success"
                                : "warning"
                          }
                        >
                          {product.deleted_at
                            ? "Eliminado"
                            : product.is_active
                              ? "Activo"
                              : "Inactivo"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {!product.deleted_at && (
                      <button
                        onClick={() =>
                          handleChangeStatus(
                            product.id,
                            !product.is_active,
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-control text-gray-600 transition hover:bg-gray-100"
                        title={
                          product.is_active
                            ? "Desactivar producto"
                            : "Activar producto"
                        }
                        aria-label={
                          product.is_active
                            ? `Desactivar ${product.name}`
                            : `Activar ${product.name}`
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
                      className="flex h-9 w-9 items-center justify-center rounded-control text-gray-600 transition hover:bg-gray-100"
                      title="Editar producto"
                      aria-label={`Editar ${product.name}`}
                    >
                      <Pencil size={18} />
                    </button>

                    {!product.deleted_at && (
                      <button
                        onClick={() => setConfirmDeleteId(product.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-control text-danger transition hover:bg-danger-bg"
                        title="Eliminar producto"
                        aria-label={`Eliminar ${product.name}`}
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
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </Button>

          <span className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Siguiente
          </Button>
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
