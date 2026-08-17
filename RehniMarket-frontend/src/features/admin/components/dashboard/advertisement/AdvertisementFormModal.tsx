import { useEffect, useRef, useState } from "react";
import { X, Save, Upload, Search } from "lucide-react";

import {
  getPublicProducts,
  getPublicProductDetail,
  getCatalogs,
} from "@/features/public/products/api/productsService";
import { getAdminCompanies, getAdminCompany } from "@/features/admin/api/companyService";

import type { AdminAdvertisementResponse } from "@/features/admin/types/response";
import type { AdvertisementTargetType } from "@/features/admin/types/request";
import type { PublicCatalog } from "@/features/public/products/types/response";
import type { PublicProductCard } from "@/features/public/home/types/response";
import type { AdminCompanyResponse } from "@/features/admin/types/response";

// Etiqueta + configuración sugerida por tipo (ver ALCANCE > Anuncios
// dinámicos): PROMOTION/BLACK_FRIDAY/CYBER_DAYS comparten exactamente el
// mismo campo (minimumDiscount) - solo cambia qué se le sugiere al admin
// como umbral típico y el emoji del título, no la lógica (esa vive una
// sola vez en el backend, ver AdvertisementTargeting.py).
const TARGET_TYPE_OPTIONS: { value: AdvertisementTargetType; label: string }[] = [
  { value: "PRODUCT", label: "Producto específico" },
  { value: "CATEGORY", label: "Categoría" },
  { value: "COMPANY", label: "Empresa" },
  { value: "PROMOTION", label: "Promoción" },
  { value: "BLACK_FRIDAY", label: "🔥 Black Friday" },
  { value: "CYBER_DAYS", label: "Cyber Days" },
  { value: "LIQUIDATION", label: "Liquidación" },
  { value: "NEW_RELEASE", label: "Nuevos lanzamientos" },
];

export interface AdvertisementFormValues {
  title: string;
  description: string;
  buttonText: string;
  // Solo se usa cuando targetType es "" (manual clásico).
  buttonLink: string;
  order: number;
  isActive: boolean;
  // Desktop/tablet
  image: File | null;
  // Mobile - opcional
  mobileImage: File | null;
  // Solo aplica en edición: elimina la imagen móvil actual sin
  // reemplazarla. Se ignora si mobileImage también viene seteado.
  removeMobileImage: boolean;
  // Anuncios dinámicos por reglas (ver ALCANCE) - "" = manual clásico.
  targetType: AdvertisementTargetType | "";
  targetProductId: string;
  targetCatalogId: string;
  targetCompanyId: string;
  minimumDiscount: number | null;
  maximumStock: number | null;
  maxAgeDays: number | null;
  // Solo en edición: pasar de un tipo dinámico de vuelta a manual
  // clásico (ver UpdateAdvertisementRequest.clear_target).
  clearTarget: boolean;
}

interface AdvertisementFormModalProps {
  isOpen: boolean;
  advertisement: AdminAdvertisementResponse | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: AdvertisementFormValues) => void;
}

// El padre monta este componente con una `key` distinta cada vez que se
// abre (ver Advertisements.tsx), así que el valor inicial de useState ya
// llega "fresco" en cada apertura sin necesitar un efecto para resetearlo
// (mismo patrón que ColorFormModal.tsx).
export default function AdvertisementFormModal({
  isOpen,
  advertisement,
  loading,
  onClose,
  onSubmit,
}: AdvertisementFormModalProps) {
  const [title, setTitle] = useState(advertisement?.title ?? "");
  const [description, setDescription] = useState(advertisement?.description ?? "");
  const [buttonText, setButtonText] = useState(advertisement?.button_text ?? "");
  const [buttonLink, setButtonLink] = useState(advertisement?.button_link ?? "");
  const [order, setOrder] = useState(advertisement?.order ?? 0);
  const [isActive, setIsActive] = useState(advertisement?.is_active ?? true);

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(advertisement?.image_url ?? null);

  const [mobileImage, setMobileImage] = useState<File | null>(null);
  const [mobilePreview, setMobilePreview] = useState<string | null>(
    advertisement?.mobile_image_url ?? null,
  );
  const [removeMobileImage, setRemoveMobileImage] = useState(false);

  // Anuncios dinámicos por reglas (ver ALCANCE) - "" = manual clásico
  // (mismo anuncio de siempre, con button_link editable a mano).
  const [targetType, setTargetType] = useState<AdvertisementTargetType | "">(
    advertisement?.target_type ?? "",
  );
  const [targetProductId, setTargetProductId] = useState(advertisement?.target_product_id ?? "");
  const [targetCatalogId, setTargetCatalogId] = useState(advertisement?.target_catalog_id ?? "");
  const [targetCompanyId, setTargetCompanyId] = useState(advertisement?.target_company_id ?? "");
  const [minimumDiscount, setMinimumDiscount] = useState(
    advertisement?.minimum_discount?.toString() ?? "",
  );
  const [maximumStock, setMaximumStock] = useState(advertisement?.maximum_stock?.toString() ?? "");
  const [maxAgeDays, setMaxAgeDays] = useState(advertisement?.max_age_days?.toString() ?? "");

  // Catálogos reales para el selector de CATEGORY (ver ALCANCE > "No
  // utilizar datos hardcodeados") - lista corta, se carga completa una
  // sola vez.
  const [catalogs, setCatalogs] = useState<PublicCatalog[]>([]);

  // Buscador de producto (PRODUCT) y empresa (COMPANY) - mismo patrón de
  // "buscar y elegir de una lista" que ya usa el navbar público (ver
  // navbar.tsx), reutilizando los endpoints ya existentes en vez de
  // crear uno nuevo solo para este selector.
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<PublicProductCard[]>([]);
  const [selectedProductLabel, setSelectedProductLabel] = useState("");

  const [companyQuery, setCompanyQuery] = useState("");
  const [companyResults, setCompanyResults] = useState<AdminCompanyResponse[]>([]);
  const [selectedCompanyLabel, setSelectedCompanyLabel] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = advertisement !== null;

  // Al editar un anuncio que ya apunta a un producto/empresa puntual,
  // solo se conoce el id (ver AdminAdvertisementResponse) - se resuelve
  // el nombre una vez para mostrarlo en el buscador en vez de un id
  // vacío/confuso.
  useEffect(() => {
    if (advertisement?.target_type === "PRODUCT" && advertisement.target_product_id) {
      getPublicProductDetail(advertisement.target_product_id)
        .then((product) => setSelectedProductLabel(product.name))
        .catch((error) => console.error("Error cargando el producto del anuncio:", error));
    }

    if (advertisement?.target_type === "COMPANY" && advertisement.target_company_id) {
      getAdminCompany(advertisement.target_company_id)
        .then((company) => setSelectedCompanyLabel(company.nameCompany))
        .catch((error) => console.error("Error cargando la empresa del anuncio:", error));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (targetType !== "CATEGORY") return;

    getCatalogs()
      .then(setCatalogs)
      .catch((error) => console.error("Error cargando categorías:", error));
  }, [targetType]);

  // Debounce de la búsqueda de producto (mismo criterio de 300ms que el
  // resto del dashboard, ver Products.tsx). El caso "vaciar resultados"
  // también se difiere con setTimeout (mismo patrón que el resto del
  // proyecto, ver Orders.tsx) para no hacer setState de forma síncrona
  // dentro del efecto.
  useEffect(() => {
    if (targetType !== "PRODUCT" || !productQuery.trim()) {
      const timeout = setTimeout(() => setProductResults([]));
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => {
      getPublicProducts({ search: productQuery.trim(), limit: 6 })
        .then((response) => setProductResults(response.products))
        .catch((error) => console.error("Error buscando productos:", error));
    }, 300);

    return () => clearTimeout(timeout);
  }, [targetType, productQuery]);

  useEffect(() => {
    if (targetType !== "COMPANY" || !companyQuery.trim()) {
      const timeout = setTimeout(() => setCompanyResults([]));
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => {
      getAdminCompanies(6, undefined, companyQuery.trim())
        .then((response) => setCompanyResults(response.items))
        .catch((error) => console.error("Error buscando empresas:", error));
    }, 300);

    return () => clearTimeout(timeout);
  }, [targetType, companyQuery]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleMobileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setMobileImage(file);
    setMobilePreview(URL.createObjectURL(file));
    setRemoveMobileImage(false);
  };

  const handleRemoveMobileImage = () => {
    setMobileImage(null);
    setMobilePreview(null);
    setRemoveMobileImage(true);

    if (mobileFileInputRef.current) {
      mobileFileInputRef.current.value = "";
    }
  };

  // Requisitos mínimos por tipo (ver ALCANCE > "según el tipo mostrar
  // campos dinámicos") - evita enviar un anuncio "dinámico" a medio
  // configurar que el backend igual rechazaría.
  const isTargetValid = (() => {
    switch (targetType) {
      case "PRODUCT":
        return !!targetProductId;
      case "CATEGORY":
        return !!targetCatalogId;
      case "COMPANY":
        return !!targetCompanyId;
      case "PROMOTION":
      case "BLACK_FRIDAY":
      case "CYBER_DAYS":
        return Number(minimumDiscount) > 0;
      case "LIQUIDATION":
        return Number(minimumDiscount) > 0 || maximumStock.trim() !== "";
      case "NEW_RELEASE":
        return Number(maxAgeDays) > 0;
      default:
        return true;
    }
  })();

  const isValid = title.trim().length >= 2 && (isEditing || image !== null) && isTargetValid;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!isValid) return;

    // Solo la config del tipo elegido viaja - los campos de los otros
    // tipos quedan sin usar (ver AdvertisementTargeting.py, que solo lee
    // los que aplican a `targetType`).
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      buttonText: buttonText.trim(),
      buttonLink: buttonLink.trim(),
      order,
      isActive,
      image,
      mobileImage,
      removeMobileImage,
      targetType,
      targetProductId,
      targetCatalogId,
      targetCompanyId,
      minimumDiscount: minimumDiscount ? Number(minimumDiscount) : null,
      maximumStock: maximumStock ? Number(maximumStock) : null,
      maxAgeDays: maxAgeDays ? Number(maxAgeDays) : null,
      // Solo tiene efecto si esta edición pasó de un tipo dinámico a
      // manual clásico (ver UpdateAdvertisementRequest.clear_target).
      clearTarget: isEditing && !!advertisement?.target_type && targetType === "",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Editar anuncio" : "Nuevo anuncio"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Imagen desktop/tablet {!isEditing && <span className="text-red-500">*</span>}
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageChange}
              />

              {preview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative block h-40 w-full overflow-hidden rounded-xl border border-gray-200"
                >
                  <img src={preview} alt="" className="h-full w-full object-cover" />

                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-transparent transition group-hover:bg-black/40 group-hover:text-white">
                    Cambiar imagen
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 transition hover:border-[#7A1833] hover:text-[#7A1833]"
                >
                  <Upload size={24} />
                  <span className="text-sm">Subir imagen</span>
                </button>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Imagen móvil <span className="font-normal text-gray-400">(opcional)</span>
              </label>

              <input
                ref={mobileFileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleMobileImageChange}
              />

              {mobilePreview ? (
                <div className="relative h-40 w-full overflow-hidden rounded-xl border border-gray-200">
                  <button
                    type="button"
                    onClick={() => mobileFileInputRef.current?.click()}
                    className="group block h-full w-full"
                  >
                    <img src={mobilePreview} alt="" className="h-full w-full object-cover" />

                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-transparent transition group-hover:bg-black/40 group-hover:text-white">
                      Cambiar imagen
                    </span>
                  </button>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleRemoveMobileImage}
                      className="absolute right-2 top-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-red-600 shadow transition hover:bg-white"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => mobileFileInputRef.current?.click()}
                  className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 transition hover:border-[#7A1833] hover:text-[#7A1833]"
                >
                  <Upload size={24} />
                  <span className="text-sm">Subir imagen móvil</span>
                </button>
              )}

              <p className="mt-2 text-xs text-gray-400">
                Si no se sube una imagen móvil, se usará la imagen
                desktop/tablet en pantallas pequeñas.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Título
              </label>

              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                minLength={2}
                maxLength={150}
                required
                autoFocus
                placeholder="Ej: Nueva colección"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#7A1833] focus:ring-2 focus:ring-[#7A1833]/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Descripción
              </label>

              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Descubre nuestros productos"
                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#7A1833] focus:ring-2 focus:ring-[#7A1833]/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tipo de anuncio
              </label>

              <select
                value={targetType}
                onChange={(event) => {
                  setTargetType(event.target.value as AdvertisementTargetType | "");
                  // Cambiar de tipo invalida la config anterior (ej. un
                  // targetProductId no tiene sentido si ahora es
                  // CATEGORY) - se limpia para no enviar una mezcla
                  // inconsistente.
                  setTargetProductId("");
                  setTargetCatalogId("");
                  setTargetCompanyId("");
                  setMinimumDiscount("");
                  setMaximumStock("");
                  setMaxAgeDays("");
                  setProductQuery("");
                  setSelectedProductLabel("");
                  setCompanyQuery("");
                  setSelectedCompanyLabel("");
                }}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#7A1833] focus:ring-2 focus:ring-[#7A1833]/20"
              >
                <option value="">Manual (escribir destino a mano)</option>
                {TARGET_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* CAMPOS DINÁMICOS SEGÚN EL TIPO (ver ALCANCE) */}
            {targetType === "PRODUCT" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Producto</label>

                {selectedProductLabel ? (
                  <SelectedChip
                    label={selectedProductLabel}
                    onClear={() => {
                      setTargetProductId("");
                      setSelectedProductLabel("");
                    }}
                  />
                ) : (
                  <SearchPicker
                    query={productQuery}
                    onQueryChange={setProductQuery}
                    placeholder="Buscar producto por nombre..."
                    results={productResults.map((p) => ({
                      id: p.id,
                      label: p.name,
                      sublabel: p.company_name,
                    }))}
                    onSelect={(result) => {
                      setTargetProductId(result.id);
                      setSelectedProductLabel(result.label);
                    }}
                  />
                )}
              </div>
            )}

            {targetType === "CATEGORY" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Categoría</label>

                <select
                  value={targetCatalogId}
                  onChange={(event) => setTargetCatalogId(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#7A1833] focus:ring-2 focus:ring-[#7A1833]/20"
                >
                  <option value="">Selecciona una categoría</option>
                  {catalogs.map((catalog) => (
                    <option key={catalog.id} value={catalog.id}>
                      {catalog.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {targetType === "COMPANY" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Empresa</label>

                {selectedCompanyLabel ? (
                  <SelectedChip
                    label={selectedCompanyLabel}
                    onClear={() => {
                      setTargetCompanyId("");
                      setSelectedCompanyLabel("");
                    }}
                  />
                ) : (
                  <SearchPicker
                    query={companyQuery}
                    onQueryChange={setCompanyQuery}
                    placeholder="Buscar empresa por nombre..."
                    results={companyResults.map((c) => ({ id: c.id, label: c.nameCompany }))}
                    onSelect={(result) => {
                      setTargetCompanyId(result.id);
                      setSelectedCompanyLabel(result.label);
                    }}
                  />
                )}
              </div>
            )}

            {(targetType === "PROMOTION" ||
              targetType === "BLACK_FRIDAY" ||
              targetType === "CYBER_DAYS") && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Descuento mínimo (%)
                </label>

                <input
                  type="number"
                  min={1}
                  max={100}
                  value={minimumDiscount}
                  onChange={(event) => setMinimumDiscount(event.target.value)}
                  placeholder={
                    targetType === "BLACK_FRIDAY" ? "30" : targetType === "CYBER_DAYS" ? "15" : "20"
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#7A1833] focus:ring-2 focus:ring-[#7A1833]/20"
                />

                <p className="mt-2 text-xs text-gray-400">
                  Muestra productos con descuento ≥ este porcentaje.
                </p>
              </div>
            )}

            {targetType === "LIQUIDATION" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Descuento mínimo (%)
                  </label>

                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={minimumDiscount}
                    onChange={(event) => setMinimumDiscount(event.target.value)}
                    placeholder="40"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#7A1833] focus:ring-2 focus:ring-[#7A1833]/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Stock máximo
                  </label>

                  <input
                    type="number"
                    min={0}
                    value={maximumStock}
                    onChange={(event) => setMaximumStock(event.target.value)}
                    placeholder="5"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#7A1833] focus:ring-2 focus:ring-[#7A1833]/20"
                  />
                </div>

                <p className="col-span-2 -mt-2 text-xs text-gray-400">
                  Completa uno de los dos (o ambos): descuento mínimo y/o stock máximo.
                </p>
              </div>
            )}

            {targetType === "NEW_RELEASE" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Días máximos desde la creación
                </label>

                <input
                  type="number"
                  min={1}
                  value={maxAgeDays}
                  onChange={(event) => setMaxAgeDays(event.target.value)}
                  placeholder="30"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#7A1833] focus:ring-2 focus:ring-[#7A1833]/20"
                />

                <p className="mt-2 text-xs text-gray-400">
                  Muestra productos creados en los últimos N días.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Texto del botón
                </label>

                <input
                  type="text"
                  value={buttonText}
                  onChange={(event) => setButtonText(event.target.value)}
                  maxLength={50}
                  placeholder="Ver productos"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#7A1833] focus:ring-2 focus:ring-[#7A1833]/20"
                />
              </div>

              {targetType === "" ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Destino
                  </label>

                  <input
                    type="text"
                    value={buttonLink}
                    onChange={(event) => setButtonLink(event.target.value)}
                    maxLength={255}
                    placeholder="/products"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#7A1833] focus:ring-2 focus:ring-[#7A1833]/20"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Destino
                  </label>

                  <div className="flex h-[46px] items-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 text-sm text-gray-500">
                    Se calcula automáticamente
                  </div>
                </div>
              )}
            </div>

            <p className="-mt-2 text-xs text-gray-400">
              {targetType === ""
                ? "Si dejas el texto o el destino vacíos, el anuncio no mostrará botón."
                : "El destino se calcula solo según el tipo de anuncio - ya no se escribe a mano."}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Orden
                </label>

                <input
                  type="number"
                  value={order}
                  onChange={(event) => {
                    // type="number" ya restringe casi todo, pero valores
                    // extremos (ej. notación científica "1e400") pueden
                    // producir Infinity - nunca se guarda en el estado
                    // (ver ValueError: "Out of range float values are not
                    // JSON compliant").
                    const parsed = Number(event.target.value);
                    setOrder(Number.isFinite(parsed) ? parsed : 0);
                  }}
                  min={0}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#7A1833] focus:ring-2 focus:ring-[#7A1833]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Estado
                </label>

                <button
                  type="button"
                  onClick={() => setIsActive((current) => !current)}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-gray-200 bg-gray-50 text-gray-500"
                  }`}
                >
                  {isActive ? "🟢 Activo" : "🔴 Inactivo"}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading || !isValid}
              className="flex items-center gap-2 rounded-xl bg-[#7A1833] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#64132a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={16} />
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Chip de "ya elegido" para PRODUCT/COMPANY - reemplaza al buscador una
// vez que hay una selección, con una X para volver a buscar.
function SelectedChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900">
      <span className="truncate">{label}</span>

      <button
        type="button"
        onClick={onClear}
        className="ml-3 shrink-0 text-gray-400 hover:text-gray-600"
      >
        <X size={16} />
      </button>
    </div>
  );
}

interface SearchPickerResult {
  id: string;
  label: string;
  sublabel?: string;
}

// Buscador reutilizado por PRODUCT y COMPANY (ver ALCANCE > "sin
// duplicar lógica") - mismo patrón de buscar-y-elegir que ya usa el
// navbar público, sobre los endpoints ya existentes.
function SearchPicker({
  query,
  onQueryChange,
  placeholder,
  results,
  onSelect,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder: string;
  results: SearchPickerResult[];
  onSelect: (result: SearchPickerResult) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-3">
        <Search size={16} className="text-gray-400" />

        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={placeholder}
          className="w-full text-sm text-gray-900 outline-none"
        />
      </div>

      {results.length > 0 && (
        <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-gray-200">
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => onSelect(result)}
              className="flex w-full flex-col items-start border-b border-gray-100 px-4 py-2.5 text-left text-sm last:border-b-0 hover:bg-gray-50"
            >
              <span className="text-gray-900">{result.label}</span>
              {result.sublabel && <span className="text-xs text-gray-400">{result.sublabel}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
