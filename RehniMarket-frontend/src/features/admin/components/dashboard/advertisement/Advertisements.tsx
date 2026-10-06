import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, Loader2, Power, Megaphone, Download } from "lucide-react";

import { Badge, Button, EmptyState, Skeleton } from "@/shared/components/ui";

import AdvertisementFormModal from "./AdvertisementFormModal";
import type { AdvertisementFormValues } from "./AdvertisementFormModal";
import ConfirmModal from "@/shared/components/ConfirmModal";
import AdvertisementPreviewModal from "./AdvertisementPreviewModal";
import bannerTemplateDesktop from "@/assets/banner-template-desktop.png";
import bannerTemplateMobile from "@/assets/banner-template-mobile.png";

import {
  getAdminAdvertisements,
  createAdminAdvertisement,
  updateAdminAdvertisement,
  changeAdminAdvertisementStatus,
  deleteAdminAdvertisement,
} from "@/features/admin/api/advertisementService";

import type { AdminAdvertisementResponse } from "@/features/admin/types/response";

const downloadTemplate = (file: string, name: string) => {
  const link = document.createElement("a");

  link.href = file;
  link.download = name;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  PRODUCT: "Producto específico",
  CATEGORY: "Categoría",
  COMPANY: "Empresa",
  PROMOTION: "Promoción",
  BLACK_FRIDAY: "Black Friday",
  CYBER_DAYS: "Cyber Days",
  LIQUIDATION: "Liquidación",
  NEW_RELEASE: "Nuevos lanzamientos",
};

export default function Advertisements() {
  const [advertisements, setAdvertisements] = useState<AdminAdvertisementResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingAdvertisement, setEditingAdvertisement] =
    useState<AdminAdvertisementResponse | null>(null);
  const [saving, setSaving] = useState(false);

  const [previewTarget, setPreviewTarget] = useState<AdminAdvertisementResponse | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AdminAdvertisementResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [statusChangingId, setStatusChangingId] = useState<string | null>(null);

  useEffect(() => {
    const loadAdvertisements = async () => {
      try {
        setLoading(true);

        const response = await getAdminAdvertisements();

        setAdvertisements(response);
      } catch (error) {
        console.error("Error cargando anuncios:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAdvertisements();
  }, []);

  const handleOpenCreate = () => {
    setEditingAdvertisement(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (advertisement: AdminAdvertisementResponse) => {
    setEditingAdvertisement(advertisement);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    if (saving) return;

    setFormOpen(false);
    setEditingAdvertisement(null);
  };

  const sortAdvertisements = (items: AdminAdvertisementResponse[]) =>
    [...items].sort(
      (a, b) => a.order - b.order || a.created_at.localeCompare(b.created_at),
    );

  const buildTargetFields = (values: AdvertisementFormValues) =>
    values.targetType
      ? {
          target_type: values.targetType,
          ...(values.targetType === "PRODUCT" && values.targetProductId
            ? { target_product_id: values.targetProductId }
            : {}),
          ...(values.targetType === "CATEGORY" && values.targetCatalogId
            ? { target_catalog_id: values.targetCatalogId }
            : {}),
          ...(values.targetType === "COMPANY" && values.targetCompanyId
            ? { target_company_id: values.targetCompanyId }
            : {}),
          ...(values.minimumDiscount ? { minimum_discount: values.minimumDiscount } : {}),
          ...(values.maximumStock ? { maximum_stock: values.maximumStock } : {}),
          ...(values.maxAgeDays ? { max_age_days: values.maxAgeDays } : {}),
        }
      : {};

  const handleSubmitForm = async (values: AdvertisementFormValues) => {
    try {
      setSaving(true);

      if (editingAdvertisement) {
        const updated = await updateAdminAdvertisement(editingAdvertisement.id, {
          button_link: values.buttonLink,
          order: values.order,
          is_active: values.isActive,
          ...(values.image ? { image: values.image } : {}),
          ...(values.mobileImage ? { mobile_image: values.mobileImage } : {}),
          ...(values.removeMobileImage ? { remove_mobile_image: true } : {}),
          ...(values.clearTarget ? { clear_target: true } : {}),
          ...buildTargetFields(values),
        });

        setAdvertisements((current) =>
          sortAdvertisements(
            current.map((advertisement) =>
              advertisement.id === updated.id ? updated : advertisement,
            ),
          ),
        );
      } else {
        if (!values.image) return;

        const created = await createAdminAdvertisement({
          button_link: values.buttonLink || undefined,
          order: values.order,
          is_active: values.isActive,
          image: values.image,
          ...(values.mobileImage ? { mobile_image: values.mobileImage } : {}),
          ...buildTargetFields(values),
        });

        setAdvertisements((current) => sortAdvertisements([...current, created]));
      }

      setFormOpen(false);
      setEditingAdvertisement(null);
    } catch (error) {
      console.error("Error guardando anuncio:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (advertisement: AdminAdvertisementResponse) => {
    try {
      setStatusChangingId(advertisement.id);

      const updated = await changeAdminAdvertisementStatus(
        advertisement.id,
        !advertisement.is_active,
      );

      setAdvertisements((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (error) {
      console.error("Error cambiando el estado del anuncio:", error);
    } finally {
      setStatusChangingId(null);
    }
  };

  const handleCloseDelete = () => {
    if (deleting) return;

    setDeleteTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);

      await deleteAdminAdvertisement(deleteTarget.id);

      setAdvertisements((current) =>
        current.filter((advertisement) => advertisement.id !== deleteTarget.id),
      );

      setDeleteTarget(null);
    } catch (error) {
      console.error("Error eliminando anuncio:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Anuncios</h2>
          <p className="mt-1 text-sm text-gray-500">
            Administra el Hero que se muestra al comienzo del Home. Descarga una
            plantilla como base para diseñar tu banner.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leadingIcon={<Download size={16} />}
            onClick={() => downloadTemplate(bannerTemplateDesktop, "banner-template-desktop.png")}
          >
            Plantilla web
          </Button>

          <Button
            variant="outline"
            size="sm"
            leadingIcon={<Download size={16} />}
            onClick={() => downloadTemplate(bannerTemplateMobile, "banner-template-mobile.png")}
          >
            Plantilla móvil
          </Button>

          <Button onClick={handleOpenCreate} leadingIcon={<Plus size={18} />}>
            Nuevo anuncio
          </Button>
        </div>
      </div>

      <section className="mt-5 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-card" />
            ))}
          </div>
        ) : advertisements.length === 0 ? (
          <EmptyState
            icon={<Megaphone size={22} />}
            title="Aún no hay anuncios"
            description="Crea el primer anuncio para el Hero del Home."
          />
        ) : (
          advertisements.map((advertisement) => (
            <div
              key={advertisement.id}
              className="flex flex-col gap-4 rounded-card border border-gray-200 bg-surface-1 p-4 shadow-card sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-4">
                <img
                  src={advertisement.image_url}
                  alt=""
                  className="h-14 w-24 shrink-0 rounded-control object-cover"
                />

                <div className="min-w-0">
                  <p className="font-medium text-gray-900">
                    {TARGET_TYPE_LABELS[advertisement.target_type ?? ""] ?? "Banner manual"}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <Badge tone={advertisement.is_active ? "success" : "neutral"}>
                      {advertisement.is_active ? "Activo" : "Inactivo"}
                    </Badge>

                    <span>Orden: {advertisement.order}</span>

                    {advertisement.target_type === "CATEGORY" && advertisement.minimum_discount ? (
                      <span>Descuento: {advertisement.minimum_discount}%</span>
                    ) : null}

                    {advertisement.button_link && (
                      <span className="truncate">Destino: {advertisement.button_link}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewTarget(advertisement)}
                  className="flex h-9 w-9 items-center justify-center rounded-control text-gray-600 transition hover:bg-gray-100"
                  title="Ver anuncio"
                  aria-label="Ver anuncio"
                >
                  <Eye size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(advertisement)}
                  className="flex h-9 w-9 items-center justify-center rounded-control text-gray-600 transition hover:bg-gray-100"
                  title="Editar anuncio"
                  aria-label="Editar anuncio"
                >
                  <Pencil size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleStatus(advertisement)}
                  disabled={statusChangingId === advertisement.id}
                  className={`flex h-9 w-9 items-center justify-center rounded-control transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 ${
                    advertisement.is_active ? "text-success" : "text-gray-400"
                  }`}
                  title={advertisement.is_active ? "Desactivar" : "Activar"}
                  aria-label={advertisement.is_active ? "Desactivar anuncio" : "Activar anuncio"}
                >
                  {statusChangingId === advertisement.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Power size={18} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteTarget(advertisement)}
                  className="flex h-9 w-9 items-center justify-center rounded-control text-danger transition hover:bg-danger-bg"
                  title="Eliminar anuncio"
                  aria-label="Eliminar anuncio"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      <AdvertisementFormModal
        key={formOpen ? (editingAdvertisement?.id ?? "new") : "closed"}
        isOpen={formOpen}
        advertisement={editingAdvertisement}
        loading={saving}
        onClose={handleCloseForm}
        onSubmit={handleSubmitForm}
      />

      <AdvertisementPreviewModal
        isOpen={previewTarget !== null}
        advertisement={previewTarget}
        onClose={() => setPreviewTarget(null)}
      />

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Eliminar anuncio"
        tone="danger"
        confirmLabel="Eliminar anuncio"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={handleCloseDelete}
        message={
          <>
            Estás a punto de eliminar este anuncio. Dejará de mostrarse en el
            Home inmediatamente.{" "}
            <span className="font-medium text-danger">
              Esta acción no se puede deshacer.
            </span>
          </>
        }
      />
    </div>
  );
}
