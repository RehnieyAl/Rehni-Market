/** Sección "Imagen de la empresa" de Mi tienda: logo y banner con vista previa, cambio, plantillas y guardado. */
import { Download, ImagePlus, Save } from "lucide-react";

import CompanyAvatar from "@/features/company/components/CompanyAvatar";
import CompanyBanner, { BANNER_SIZE_HINT } from "@/features/company/components/CompanyBanner";
import { Button } from "@/shared/components/ui";
import { downloadFile } from "@/shared/utils/downloadFile";
import { FILE_ACCEPT } from "@/shared/validation/files";
import defaultLogo from "@/assets/logo-default.png";
import bannerTemplate from "@/assets/banner-template.png";

import type { CompanyMediaUpload } from "@/features/company/types/request";

interface CompanyImageSettingsProps {
  companyName: string;
  logo: string | null;
  banner: string | null;
  selected: CompanyMediaUpload;
  previews: { logo: string | null; banner: string | null };
  saving: boolean;
  onSelect: (field: keyof CompanyMediaUpload, file: File | undefined, input: HTMLInputElement) => void;
  onSubmit: () => void;
}

// El input queda accesible (sr-only, no `hidden`): el teclado llega a él y el label muestra el foco.
function FilePickerButton({ label, onChange }: { label: string; onChange: (input: HTMLInputElement) => void }) {
  return (
    <label className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-control bg-primary text-sm font-medium text-white transition fill-hover focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-secondary">
      <ImagePlus size={18} aria-hidden="true" />
      {label}
      <input
        type="file"
        accept={FILE_ACCEPT.image}
        className="sr-only"
        onChange={(event) => onChange(event.currentTarget)}
      />
    </label>
  );
}

export default function CompanyImageSettings({
  companyName,
  logo,
  banner,
  selected,
  previews,
  saving,
  onSelect,
  onSubmit,
}: CompanyImageSettingsProps) {
  return (
    <section aria-labelledby="store-images-title" className="rounded-card border border-hairline bg-surface-1 p-5 sm:p-6">
      <h3 id="store-images-title" className="text-lg font-semibold text-ink">
        Imagen de la empresa
      </h3>
      <p className="mt-1 text-sm text-ink-muted">Personaliza la imagen que verán tus clientes.</p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-3">
          <h4 className="self-start text-sm font-medium text-ink lg:self-center">Logo empresa</h4>
          <CompanyAvatar src={previews.logo ?? logo} name={companyName} className="h-36 w-36" />
          <FilePickerButton
            label="Cambiar logo"
            onChange={(input) => onSelect("photo_profile", input.files?.[0], input)}
          />
          {selected.photo_profile && (
            <p className="w-full truncate text-xs text-success">Imagen seleccionada: {selected.photo_profile.name}</p>
          )}
          <Button
            variant="outline"
            fullWidth
            leadingIcon={<Download size={16} />}
            onClick={() => downloadFile(defaultLogo, "plantilla-logo-empresa-600x600.png")}
          >
            Descargar plantilla
          </Button>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <h4 className="text-sm font-medium text-ink">Banner empresa</h4>
          <CompanyBanner
            src={previews.banner ?? banner}
            alt="Banner empresa"
            className="rounded-card border border-hairline"
          />
          <p className="text-xs text-ink-muted">{BANNER_SIZE_HINT}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <FilePickerButton
              label="Cambiar banner"
              onChange={(input) => onSelect("banner_profile", input.files?.[0], input)}
            />
            <Button
              variant="outline"
              leadingIcon={<Download size={16} />}
              onClick={() => downloadFile(bannerTemplate, "plantilla-banner-empresa-1600x420.png")}
            >
              Descargar plantilla
            </Button>
          </div>
          {selected.banner_profile && (
            <p className="truncate text-xs text-success">Banner seleccionado: {selected.banner_profile.name}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          leadingIcon={<Save size={18} />}
          loading={saving}
          disabled={!selected.photo_profile && !selected.banner_profile}
          onClick={onSubmit}
        >
          Actualizar imágenes
        </Button>
      </div>
    </section>
  );
}
