/** Modal "Mi tienda": carga y guarda solo información empresarial (imágenes, datos y certificado) y avisa
 * antes de cerrar si hay cambios sin guardar. Lo abren "Editar perfil" y "Configurar mi tienda". */
import { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

import CompanyCertificateStatus from "./CompanyCertificateStatus";
import CompanyImageSettings from "./CompanyImageSettings";
import CompanyInformationForm, { type CompanyInformationValues } from "./CompanyInformationForm";
import { contactErrors } from "@/features/company/utils/contactValidation";
import { Button, ErrorState, Modal } from "@/shared/components/ui";
import { useAlert } from "@/shared/components/alert/useAlert";
import { validateFile } from "@/shared/validation/files";
import {
  getMyCompanyProfile,
  patchMediaLogoBanner,
  updateMyCompanyProfile,
} from "@/features/company/api/companyService";

import type { CompanyMediaUpload } from "@/features/company/types/request";
import type { CompanyStoreSettingsResponse } from "@/features/company/types/response";

interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Se llama tras guardar, para que el panel refresque su cabecera. */
  onSaved: () => void;
}

const EMPTY_VALUES: CompanyInformationValues = {
  nameCompany: "",
  addressCompany: "",
  description: "",
  contactEmail: "",
  contactPhone: "",
  contactPublic: false,
};

function valuesFrom(company: CompanyStoreSettingsResponse): CompanyInformationValues {
  return {
    nameCompany: company.nameCompany,
    addressCompany: company.addressCompany,
    description: company.description ?? "",
    contactEmail: company.contactEmail ?? "",
    contactPhone: company.contactPhone ?? "",
    contactPublic: company.contactPublic === true,
  };
}

export default function CompanySettingsModal({ isOpen, onClose, onSaved }: CompanySettingsModalProps) {
  const { showAlert } = useAlert();

  const [company, setCompany] = useState<CompanyStoreSettingsResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [values, setValues] = useState<CompanyInformationValues>(EMPTY_VALUES);
  const [editing, setEditing] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);

  const [media, setMedia] = useState<CompanyMediaUpload>({});
  const [previews, setPreviews] = useState<{ logo: string | null; banner: string | null }>({ logo: null, banner: null });
  const [savingMedia, setSavingMedia] = useState(false);

  const [confirmingClose, setConfirmingClose] = useState(false);
  const keepEditingRef = useRef<HTMLButtonElement>(null);
  const unsavedMessageId = useId();

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const load = async () => {
      try {
        setFailed(false);
        const data = await getMyCompanyProfile();
        if (cancelled) return;
        setCompany(data);
        setValues(valuesFrom(data));
      } catch (error) {
        console.error("Error cargando la información de la tienda:", error);
        if (!cancelled) setFailed(true);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [isOpen, reloadKey]);

  // Vistas previas blob: vivas. El cierre del efecto lee este conjunto (no el estado del primer render):
  // al desmontar se liberan todas, y al reemplazar una imagen solo la anterior.
  const livePreviews = useRef(new Set<string>());

  useEffect(() => {
    const urls = livePreviews.current;

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const revokePreview = (url: string | null) => {
    if (!url) return;
    URL.revokeObjectURL(url);
    livePreviews.current.delete(url);
  };

  const clearPreviews = () => {
    revokePreview(previews.logo);
    revokePreview(previews.banner);
    setPreviews({ logo: null, banner: null });
  };

  useEffect(() => {
    if (confirmingClose) keepEditingRef.current?.focus();
  }, [confirmingClose]);

  const infoChanged =
    editing && company !== null && JSON.stringify(values) !== JSON.stringify(valuesFrom(company));
  const hasUnsavedChanges = infoChanged || Boolean(media.photo_profile || media.banner_profile);

  const resetAndClose = () => {
    setConfirmingClose(false);
    setEditing(false);
    setMedia({});
    clearPreviews();
    if (company) setValues(valuesFrom(company));
    onClose();
  };

  const requestClose = () => {
    if (savingInfo || savingMedia) return;
    if (hasUnsavedChanges) {
      setConfirmingClose(true);
      return;
    }
    resetAndClose();
  };

  const handleSelectMedia = (field: keyof CompanyMediaUpload, file: File | undefined, input: HTMLInputElement) => {
    if (!file) return;

    const error = validateFile(file, "image", field === "photo_profile" ? "Logo" : "Banner");
    if (error) {
      input.value = "";
      showAlert("error", error);
      return;
    }

    const previewKey = field === "photo_profile" ? "logo" : "banner";
    revokePreview(previews[previewKey]);
    const url = URL.createObjectURL(file);
    livePreviews.current.add(url);
    setMedia((prev) => ({ ...prev, [field]: file }));
    setPreviews((prev) => ({ ...prev, [previewKey]: url }));
  };

  const handleSaveMedia = async () => {
    if (!media.photo_profile && !media.banner_profile) return;

    try {
      setSavingMedia(true);
      const response = await patchMediaLogoBanner(media);
      setCompany((prev) =>
        prev ? { ...prev, logo: response.logo ?? prev.logo, banner: response.banner ?? prev.banner } : prev,
      );
      setMedia({});
      clearPreviews();
      showAlert("success", "Imágenes de la tienda actualizadas.");
      onSaved();
    } catch (error) {
      console.error("Error actualizando imágenes", error);
    } finally {
      setSavingMedia(false);
    }
  };

  const handleSaveInfo = async () => {
    if (contactErrors(values).contactEmail || contactErrors(values).contactPhone) return;
    try {
      setSavingInfo(true);
      await updateMyCompanyProfile(values);
      setCompany((prev) => (prev ? { ...prev, ...values } : prev));
      setEditing(false);
      showAlert("success", "Información de la empresa guardada.");
      onSaved();
    } catch (error) {
      console.error("Error actualizando empresa", error);
    } finally {
      setSavingInfo(false);
    }
  };

  const footer = confirmingClose ? (
    <div role="alert" className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p id={unsavedMessageId} className="flex items-center gap-2 text-sm text-warning">
        <AlertTriangle size={16} aria-hidden="true" />
        Tienes cambios sin guardar. ¿Quieres descartarlos?
      </p>
      <div className="flex gap-3">
        {/* El foco va a este botón: con aria-describedby el lector anuncia por qué el modal sigue abierto. */}
        <Button
          ref={keepEditingRef}
          variant="outline"
          aria-describedby={unsavedMessageId}
          onClick={() => setConfirmingClose(false)}
        >
          Seguir editando
        </Button>
        <Button variant="danger" onClick={resetAndClose}>
          Descartar cambios
        </Button>
      </div>
    </div>
  ) : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={requestClose}
      title="Mi tienda"
      description="Imagen, información y certificado de tu empresa."
      size="xl"
      footer={footer}
    >
      {failed ? (
        <ErrorState
          title="No se pudo cargar la información de la tienda"
          description="Intenta de nuevo en unos momentos."
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      ) : (
        <div className="space-y-6">
          <CompanyImageSettings
            companyName={company?.nameCompany ?? "tu empresa"}
            logo={company?.logo ?? null}
            banner={company?.banner ?? null}
            selected={media}
            previews={previews}
            saving={savingMedia}
            onSelect={handleSelectMedia}
            onSubmit={handleSaveMedia}
          />

          <CompanyInformationForm
            company={company}
            values={values}
            editing={editing}
            saving={savingInfo}
            onEdit={() => {
              if (company) setValues(valuesFrom(company));
              setEditing(true);
            }}
            onChange={(field, value) => setValues((prev) => ({ ...prev, [field]: value }))}
            onCancel={() => {
              if (company) setValues(valuesFrom(company));
              setEditing(false);
            }}
            onSave={handleSaveInfo}
          />

          {company && (
            <CompanyCertificateStatus status={company.certificateStatus} rejectionReason={company.rejectionReason} />
          )}
        </div>
      )}
    </Modal>
  );
}
