/** Productos del panel de empresa: métricas, búsqueda, listado paginado y alta, edición o borrado de productos. */
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  ImageOff,
  Layers,
  List,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
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
import DashboardPageHeader from "@/shared/components/dashboard/DashboardPageHeader";
import DashboardPager from "@/shared/components/dashboard/DashboardPager";
import DashboardSection from "@/shared/components/dashboard/DashboardSection";
import StatCard from "@/shared/components/dashboard/StatCard";
import { cn } from "@/shared/utils/cn";

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

  // ?new=1 (acción "Crear producto" del inicio del panel) abre directamente el formulario de alta.
  const [searchParams, setSearchParams] = useSearchParams();
  const [openProductModal, setOpenProductModal] = useState(() => searchParams.get("new") === "1");
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
      void loadProducts();
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

    void loadInitialSummary();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleProductSaved = () => {
    void loadProducts();
    void loadSummary();
  };

  const handleProductCreated = (productId: string) => {
    void loadProducts();
    void loadSummary();
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

      void loadSummary();
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

      void loadSummary();
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

  const statValue = (value: number | undefined) => (summaryLoading ? "…" : String(value ?? 0));

  return (
    <>
      <DashboardPageHeader
        icon={<Package size={26} />}
        title="Productos"
        description="Administra todos los productos de tu empresa."
        action={
          <Button leadingIcon={<Plus size={18} />} onClick={() => setOpenProductModal(true)}>
            Nuevo producto
          </Button>
        }
      />

      <section aria-label="Resumen de productos" className="mt-6 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
        <StatCard size="sm" title="Productos publicados" value={statValue(summary?.total)} icon={<Package size={20} />} tone="brand" />
        <StatCard size="sm" title="Activos" value={statValue(summary?.active)} icon={<Layers size={20} />} tone="success" />
        <StatCard size="sm" title="Agotados" value={statValue(summary?.out_of_stock)} icon={<AlertTriangle size={20} />} tone="warning" />
        <StatCard size="sm" title="Ocultos" value={statValue(summary?.hidden)} icon={<EyeOff size={20} />} tone="neutral" />
      </section>

      <DashboardSection title="Lista de productos" icon={<List size={20} />} className="mt-6">
        <Input
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

        <ul className="mt-5 space-y-3" aria-busy={loading || undefined}>
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <li key={index}>
                <Skeleton className="h-24 rounded-card dark:bg-surface-2" />
              </li>
            ))
          ) : products.length === 0 ? (
            <li>
              <EmptyState
                variant="plain"
                icon={<Package size={22} />}
                title="No se encontraron productos"
                description="Ajusta la búsqueda o crea un producto nuevo."
              />
            </li>
          ) : (
            products.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                onToggleStatus={() => handleChangeStatus(product.id, !product.is_active)}
                onEdit={() => {
                  setEditingProductId(product.id);
                  setOpenEditModal(true);
                }}
                onDelete={() => setConfirmDeleteId(product.id)}
              />
            ))
          )}
        </ul>

        <DashboardPager page={page} totalPages={totalPages} onPageChange={setPage} />
      </DashboardSection>

      <ProductForm
        isOpen={openProductModal}
        onClose={() => {
          setOpenProductModal(false);
          if (searchParams.has("new")) {
            const next = new URLSearchParams(searchParams);
            next.delete("new");
            setSearchParams(next, { replace: true });
          }
        }}
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

const ICON_BUTTON =
  "flex h-10 w-10 items-center justify-center rounded-control border border-hairline bg-surface-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary";

interface ProductRowProps {
  product: MyProductResponse;
  onToggleStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function productStatus(product: MyProductResponse) {
  if (product.deleted_at) return { label: "Eliminado", tone: "danger" as const };
  return product.is_active ? { label: "Activo", tone: "success" as const } : { label: "Inactivo", tone: "warning" as const };
}

function ProductRow({ product, onToggleStatus, onEdit, onDelete }: ProductRowProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const status = productStatus(product);

  return (
    <li className="grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3 rounded-card border border-hairline bg-surface-2/40 p-3 sm:p-4 lg:grid-cols-[5rem_minmax(0,1fr)_7.5rem_5rem_7rem_auto]">
      {product.image && !imageFailed ? (
        <img
          src={product.image}
          alt=""
          width={80}
          height={80}
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="h-16 w-16 rounded-control bg-surface-2 object-contain lg:h-20 lg:w-20"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-control border border-dashed border-gray-300 text-gray-400 lg:h-20 lg:w-20">
          <ImageOff size={22} aria-hidden="true" />
        </div>
      )}

      <div className="min-w-0">
        <h3 className="truncate font-semibold text-ink" title={product.name}>
          {product.name}
        </h3>
        <p className="line-clamp-1 text-sm text-ink-muted">{product.description}</p>
      </div>

      <dl className="col-span-2 grid grid-cols-[auto_auto_1fr] items-center gap-x-5 gap-y-3 text-sm lg:col-span-3 lg:grid-cols-[7.5rem_5rem_7rem] lg:gap-3">
        <div>
          <dt className="text-xs text-ink-muted">Precio</dt>
          <dd className="font-semibold tabular-nums text-ink">${product.price.toLocaleString("es-CO")}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Stock</dt>
          <dd className="font-semibold tabular-nums text-ink">{product.stock}</dd>
        </div>
        <div>
          <dt className="sr-only">Estado</dt>
          <dd>
            <Badge tone={status.tone} dot>
              {status.label}
            </Badge>
          </dd>
        </div>
      </dl>

      <div className="col-span-2 flex justify-end gap-2 lg:col-span-1">
        {!product.deleted_at && (
          <button
            type="button"
            onClick={onToggleStatus}
            className={cn(ICON_BUTTON, "text-ink-muted hover:text-ink")}
            title={product.is_active ? "Desactivar producto" : "Activar producto"}
            aria-label={product.is_active ? `Desactivar ${product.name}` : `Activar ${product.name}`}
          >
            {product.is_active ? <Eye size={18} aria-hidden="true" /> : <EyeOff size={18} aria-hidden="true" />}
          </button>
        )}
        <button
          type="button"
          onClick={onEdit}
          className={cn(ICON_BUTTON, "text-ink-muted hover:text-ink")}
          title="Editar producto"
          aria-label={`Editar ${product.name}`}
        >
          <Pencil size={18} aria-hidden="true" />
        </button>
        {!product.deleted_at && (
          <button
            type="button"
            onClick={onDelete}
            className={cn(ICON_BUTTON, "text-danger hover:bg-danger-bg")}
            title="Eliminar producto"
            aria-label={`Eliminar ${product.name}`}
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        )}
      </div>
    </li>
  );
}
