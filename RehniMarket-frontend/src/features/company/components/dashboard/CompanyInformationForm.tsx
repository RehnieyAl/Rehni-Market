/** Sección "Información de la empresa" de Mi tienda: razón social, dirección, descripción y contacto
 * empresarial editables; NIT, dígito de verificación y estado de solo lectura (no se cambian desde el panel). */
import { Pencil, Save, X } from "lucide-react";

import { Badge, Button, Input, Skeleton, Textarea } from "@/shared/components/ui";

import { contactErrors } from "@/features/company/utils/contactValidation";

import type { CompanyStoreSettingsResponse } from "@/features/company/types/response";

export interface CompanyInformationValues {
  nameCompany: string;
  addressCompany: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  contactPublic: boolean;
}


interface CompanyInformationFormProps {
  company: CompanyStoreSettingsResponse | null;
  values: CompanyInformationValues;
  editing: boolean;
  saving: boolean;
  onEdit: () => void;
  onChange: <K extends keyof CompanyInformationValues>(field: K, value: CompanyInformationValues[K]) => void;
  onCancel: () => void;
  onSave: () => void;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      <p className="min-h-11 rounded-control border border-hairline bg-surface-2 px-4 py-2.5 text-sm text-ink">{value}</p>
    </div>
  );
}

export default function CompanyInformationForm({
  company,
  values,
  editing,
  saving,
  onEdit,
  onChange,
  onCancel,
  onSave,
}: CompanyInformationFormProps) {
  const suspended = company?.CompanyStatus === false;
  const errors = contactErrors(values);

  return (
    <section aria-labelledby="store-info-title" className="rounded-card border border-hairline bg-surface-1 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id="store-info-title" className="text-lg font-semibold text-ink">
            Información de la empresa
          </h3>
          <p className="mt-1 text-sm text-ink-muted">Datos de tu negocio, visibles para los compradores.</p>
        </div>

        {!editing && company && (
          <Button
            variant="outline"
            size="sm"
            leadingIcon={<Pencil size={15} />}
            onClick={onEdit}
            aria-label="Editar información de la empresa"
          >
            Editar
          </Button>
        )}
      </div>

      {!company ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2" aria-busy="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 dark:bg-surface-2" />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Input
            label="Razón social"
            value={values.nameCompany}
            disabled={!editing}
            onChange={(event) => onChange("nameCompany", event.target.value)}
          />
          <Input
            label="Dirección"
            value={values.addressCompany}
            disabled={!editing}
            onChange={(event) => onChange("addressCompany", event.target.value)}
          />
          <ReadOnlyField label="NIT" value={company.CompanyNIT} />
          <ReadOnlyField label="Dígito de verificación" value={company.CompanyNITDV} />

          <div className="md:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Estado de la empresa</span>
            <Badge tone={suspended ? "danger" : "success"} dot>
              {suspended ? "Suspendida" : "Activa"}
            </Badge>
            {suspended && company.suspensionReason && (
              <p className="mt-2 text-xs text-danger">Motivo: {company.suspensionReason}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Descripción"
              value={values.description}
              disabled={!editing}
              onChange={(event) => onChange("description", event.target.value)}
              rows={4}
              maxLength={1000}
              hint={editing ? `${values.description.length}/1000 caracteres` : undefined}
              placeholder="Cuéntale a tus clientes a qué se dedica tu empresa…"
            />
          </div>

          <fieldset className="md:col-span-2 grid gap-6 rounded-card border border-hairline p-4 md:grid-cols-2">
            <legend className="px-1 text-sm font-semibold text-ink">Contacto empresarial</legend>
            <p className="-mt-2 text-xs text-ink-muted md:col-span-2">
              El equipo de Rehni Market lo usa para comunicarse contigo sobre devoluciones y reclamaciones. Los
              compradores solo lo ven en tu perfil público si activas la opción de abajo.
            </p>
            <Input
              label="Correo de contacto"
              type="email"
              autoComplete="email"
              value={values.contactEmail}
              disabled={!editing}
              onChange={(event) => onChange("contactEmail", event.target.value)}
              placeholder="soporte@tuempresa.com"
              error={editing ? errors.contactEmail : undefined}
            />
            <Input
              label="Teléfono de contacto"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={values.contactPhone}
              disabled={!editing}
              onChange={(event) => onChange("contactPhone", event.target.value)}
              placeholder="6015551234"
              error={editing ? errors.contactPhone : undefined}
            />
            <label className="flex items-start gap-3 text-sm text-ink md:col-span-2">
              <input
                type="checkbox"
                checked={values.contactPublic}
                disabled={!editing}
                onChange={(event) => onChange("contactPublic", event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-secondary"
              />
              <span>
                Mostrar este correo y teléfono en mi perfil público
                <span className="mt-0.5 block text-xs text-ink-muted">
                  Los compradores podrán escribirte o llamarte desde tu página de empresa.
                </span>
              </span>
            </label>
          </fieldset>
        </div>
      )}

      {editing && (
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" leadingIcon={<X size={18} />} onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button leadingIcon={<Save size={18} />} loading={saving} onClick={onSave}>
            Guardar
          </Button>
        </div>
      )}
    </section>
  );
}
