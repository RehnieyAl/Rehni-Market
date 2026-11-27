/** Configuración de la página web (solo owner): correo y teléfono institucionales de Rehni Market y si
 * cada uno se publica en la web y en el pie de los correos. El backend rechaza a cualquier otro rol. */
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Globe, Mail, Phone, Save } from "lucide-react";

import DashboardPageHeader from "@/shared/components/dashboard/DashboardPageHeader";
import DashboardSection from "@/shared/components/dashboard/DashboardSection";
import { useAlert } from "@/shared/components/alert/useAlert";
import { Button, ErrorState, Input, Skeleton } from "@/shared/components/ui";
import { CONTACT_EMAIL_PATTERN } from "@/shared/utils/emailPattern";
import {
  getPlatformContact,
  updatePlatformContact,
  type PlatformContact,
} from "@/features/platform/api/platformContactService";

interface FormValues {
  contactEmail: string;
  contactPhone: string;
  emailPublic: boolean;
  phonePublic: boolean;
}

const PHONE_PATTERN = /^\+?[0-9]{7,15}$/;

function toForm(contact: PlatformContact): FormValues {
  return {
    contactEmail: contact.contactEmail ?? "",
    contactPhone: contact.contactPhone ?? "",
    emailPublic: contact.emailPublic,
    phonePublic: contact.phonePublic,
  };
}

function validate(values: FormValues): Partial<Record<"contactEmail" | "contactPhone", string>> {
  const errors: Partial<Record<"contactEmail" | "contactPhone", string>> = {};
  const email = values.contactEmail.trim();
  const phone = values.contactPhone.replace(/[\s()-]/g, "");

  if (email && !CONTACT_EMAIL_PATTERN.test(email)) errors.contactEmail = "Escribe un correo válido.";
  else if (values.emailPublic && !email) errors.contactEmail = "Para publicar el correo primero debes escribirlo.";

  if (phone && !PHONE_PATTERN.test(phone)) errors.contactPhone = "El teléfono debe tener entre 7 y 15 dígitos (puede empezar con +).";
  else if (values.phonePublic && !phone) errors.contactPhone = "Para publicar el teléfono primero debes escribirlo.";

  return errors;
}

function PublishSwitch({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <label className="mt-3 flex cursor-pointer items-center justify-between gap-4 rounded-control bg-surface-2 px-4 py-3 text-sm text-ink">
      <span>{label}</span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 shrink-0 accent-secondary"
      />
    </label>
  );
}

export default function SiteSettings() {
  const { showAlert } = useAlert();
  const [contact, setContact] = useState<PlatformContact | null>(null);
  const [values, setValues] = useState<FormValues | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  const fetchContact = useCallback(
    () =>
      getPlatformContact().then(
        (data) => {
          setContact(data);
          setValues(toForm(data));
        },
        () => setLoadError(true),
      ),
    [],
  );

  useEffect(() => {
    void fetchContact();
  }, [fetchContact]);

  const retry = () => {
    setLoadError(false);
    void fetchContact();
  };

  const errors = values ? validate(values) : {};

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!values || saving) return;
    setTouched(true);
    if (Object.keys(errors).length) return;

    setSaving(true);
    try {
      const saved = await updatePlatformContact({
        contactEmail: values.contactEmail.trim() || null,
        contactPhone: values.contactPhone.trim() || null,
        emailPublic: values.emailPublic,
        phonePublic: values.phonePublic,
      });
      setContact(saved);
      setValues(toForm(saved));
      setTouched(false);
      showAlert("success", "Información de contacto guardada.");
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.detail?.message : undefined;
      showAlert("error", message ?? "No se pudo guardar la información de contacto.");
    } finally {
      setSaving(false);
    }
  };

  const set = (patch: Partial<FormValues>) => setValues((current) => (current ? { ...current, ...patch } : current));

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        icon={<Globe size={26} />}
        title="Configuración de la página web"
        description="Datos institucionales de Rehni Market que ven los visitantes y que aparecen en los correos."
      />

      <DashboardSection title="Información de contacto" icon={<Mail size={18} />}>
        {loadError ? (
          <ErrorState title="No se pudo cargar la información de contacto" onRetry={retry} />
        ) : !values ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : (
          <form onSubmit={save} noValidate className="space-y-6">
            <p className="text-sm text-ink-muted">
              Usa canales oficiales de la plataforma, no los datos personales de una cuenta. Solo lo que actives se
              muestra en el pie de la web y de los correos.
            </p>

            <div>
              <Input
                label="Correo de contacto"
                type="email"
                autoComplete="off"
                inputMode="email"
                leadingIcon={<Mail size={18} />}
                placeholder="soporte@tudominio.com"
                value={values.contactEmail}
                onChange={(event) => set({ contactEmail: event.target.value })}
                error={touched ? errors.contactEmail : undefined}
              />
              <PublishSwitch
                label="Publicar el correo en la web y en los correos"
                checked={values.emailPublic}
                onChange={(emailPublic) => set({ emailPublic })}
              />
            </div>

            <div>
              <Input
                label="Teléfono de contacto"
                type="tel"
                autoComplete="off"
                inputMode="tel"
                leadingIcon={<Phone size={18} />}
                placeholder="+57 300 000 0000"
                hint="Usa el formato internacional con + y el indicativo del país: así funciona el botón de recargas por WhatsApp."
                value={values.contactPhone}
                onChange={(event) => set({ contactPhone: event.target.value })}
                error={touched ? errors.contactPhone : undefined}
              />
              <PublishSwitch
                label="Publicar el teléfono en la web y en los correos"
                checked={values.phonePublic}
                onChange={(phonePublic) => set({ phonePublic })}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-ink-muted">
                {contact?.updatedAt
                  ? `Última actualización: ${new Date(contact.updatedAt).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}${contact.updatedByName ? ` · ${contact.updatedByName}` : ""}`
                  : "Aún no se ha configurado."}
              </p>
              <Button type="submit" loading={saving} leadingIcon={<Save size={16} />}>
                Guardar cambios
              </Button>
            </div>
          </form>
        )}
      </DashboardSection>
    </div>
  );
}
