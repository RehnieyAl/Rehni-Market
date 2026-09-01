import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Upload, Download, Pencil, Save, X, UserRound } from "lucide-react";

import { Badge, Button, Input, Skeleton, Textarea } from "@/shared/components/ui";
import { buttonClasses } from "@/shared/components/ui/buttonVariants";
import { useAuth } from "@/features/public/auth/context/useAuth";

import {
  getMyCompanyProfile,
  updateMyCompanyProfile,
  patchMediaLogoBanner,
} from "@/features/company/api/companyService";
import CompanyRatingBadge from "@/features/public/company/components/CompanyRatingBadge";

import type {
  CompanyProfileResponse,
} from "@/features/company/types/response";

import type {
  CompanyMediaUpload,
} from "@/features/company/types/request";

import defaultLogo from "@/assets/logo-default.png";
import defaultBanner from "@/assets/banner-template.png";
import logoTemplate from "@/assets/example-logo.webp";
import bannerTemplate from "@/assets/example-banner.jpg";

export default function Company() {
  const { user } = useAuth();

  const [editing, setEditing] = useState(false);

  const [media, setMedia] = useState<CompanyMediaUpload>({});

  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [previewBanner, setPreviewBanner] = useState<string | null>(null);

  const [company, setCompany] =
    useState<CompanyProfileResponse | null>(null);

  const [form, setForm] = useState({
    nameCompany: "",
    addressCompany: "",
    description: "",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const data = await getMyCompanyProfile();

        setCompany(data);

        setForm({
          nameCompany: data.nameCompany,
          addressCompany: data.addressCompany,
          description: data.description ?? "",
        });
      } catch (error) {
        console.error("Error cargando empresa", error);
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm({
      ...form,
      [field]: value,
    });
  };

  const handleSave = async () => {
    try {
      await updateMyCompanyProfile(form);

      setCompany((prev) => (prev ? { ...prev, ...form } : prev));

      setEditing(false);
    } catch (error) {
      console.error("Error actualizando empresa", error);
    }
  };

  const handleUpdateMedia = async () => {
    try {
      if (!media.photo_profile && !media.banner_profile) {
        return;
      }

      const response = await patchMediaLogoBanner(media);

      setCompany((prev) => ({
        ...prev!,
        logo: response.logo ?? prev?.logo,
        banner: response.banner ?? prev?.banner,
      }));

      setMedia({});
    } catch (error) {
      console.error("Error actualizando imágenes", error);
    }
  };

  const handleDownloadTemplate = (file: string, name: string) => {
    const link = document.createElement("a");

    link.href = file;
    link.download = name;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  return (
    <>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Mi tienda
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Administra la información pública de tu empresa.
        </p>

        {company && <CompanyRatingBadge companyId={company.id} className="mt-3" />}
      </div>

      <section className="mt-8 rounded-card border border-gray-200 bg-white p-6 shadow-card sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900">
          Imagen de la empresa
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Personaliza la imagen que verán tus clientes.
        </p>

        <div className="mt-8 grid gap-10 lg:grid-cols-2">

          <div className="flex flex-col items-center">
            <h3 className="mb-6 font-medium text-gray-800">
              Logo empresa
            </h3>

            <div className="h-40 w-40 overflow-hidden rounded-full border-4 border-white bg-white shadow-pop">
              <img
                src={previewLogo || company?.logo || defaultLogo}
                alt="Logo empresa"
                className="h-full w-full object-cover"
              />
            </div>

            <label className="mt-6 flex h-11 w-full max-w-72 cursor-pointer items-center justify-center gap-2 rounded-control bg-primary text-sm font-medium text-primary-fg transition hover:bg-primary-hover">
              <Upload size={18} />

              Cambiar logo

              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    setMedia({
                      ...media,
                      photo_profile: file,
                    });

                    setPreviewLogo(
                      URL.createObjectURL(file),
                    );
                  }
                }}
              />
            </label>

            {media.photo_profile && (
              <p className="mt-3 text-sm text-success">
                Imagen seleccionada: {media.photo_profile.name}
              </p>
            )}

            <Button
              className="mt-3 w-full max-w-72"
              variant="outline"
              leadingIcon={<Download size={18} />}
              onClick={() => handleDownloadTemplate(logoTemplate, "example-logo.webp")}
            >
              Descargar plantilla
            </Button>
          </div>

          <div>
            <h3 className="mb-6 text-center font-medium text-gray-800">
              Banner empresa
            </h3>

            <div className="overflow-hidden rounded-card border border-gray-200 shadow-card">
              <img
                src={
                  previewBanner ||
                  company?.banner ||
                  defaultBanner
                }
                alt="Banner empresa"
                className="h-35 w-full object-cover"
              />
            </div>

            <label className="mt-6 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-control bg-primary text-sm font-medium text-primary-fg transition hover:bg-primary-hover">
              <Upload size={18} />

              Cambiar banner

              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    setMedia({
                      ...media,
                      banner_profile: file,
                    });

                    setPreviewBanner(
                      URL.createObjectURL(file),
                    );
                  }
                }}
              />
            </label>

            {media.banner_profile && (
              <p className="mt-3 text-sm text-success">
                Banner seleccionado:{" "}
                {media.banner_profile.name}
              </p>
            )}

            <Button
              className="mt-3 w-full"
              variant="outline"
              leadingIcon={<Download size={18} />}
              onClick={() => handleDownloadTemplate(bannerTemplate, "example-banner.jpg")}
            >
              Descargar plantilla
            </Button>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            leadingIcon={<Save size={18} />}
            disabled={!media.photo_profile && !media.banner_profile}
            onClick={handleUpdateMedia}
          >
            Actualizar imágenes
          </Button>
        </div>
      </section>

      <section className="mt-8 rounded-card border border-gray-200 bg-white p-6 shadow-card sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Información de la empresa
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Datos de tu negocio, visibles para los compradores.
            </p>
          </div>

          {!editing && (
            <button
              type="button"
              onClick={() => {
                if (company) {
                  setForm({
                    nameCompany: company.nameCompany,
                    addressCompany: company.addressCompany,
                    description: company.description ?? "",
                  });
                }

                setEditing(true);
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control text-gray-600 transition hover:bg-gray-100"
              aria-label="Editar información de la empresa"
            >
              <Pencil size={18} />
            </button>
          )}
        </div>

        {loading ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12" />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <InputCompany
              label="Razón social"
              value={form.nameCompany}
              edit={editing}
              onChange={(v) => handleChange("nameCompany", v)}
            />

            <InputCompany
              label="Dirección"
              value={form.addressCompany}
              edit={editing}
              onChange={(v) => handleChange("addressCompany", v)}
            />

            <ReadOnlyField label="NIT" value={company?.CompanyNIT ?? "—"} />

            <ReadOnlyField
              label="Dígito de verificación"
              value={company?.CompanyNITDV ?? "—"}
            />

            <div>
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                Estado de la empresa
              </span>
              <Badge tone={company?.CompanyStatus === false ? "danger" : "success"} dot>
                {company?.CompanyStatus === false ? "Suspendida" : "Activa"}
              </Badge>
              {company?.CompanyStatus === false && company.suspensionReason && (
                <p className="mt-2 text-xs text-danger">
                  Motivo: {company.suspensionReason}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <TextareaCompany
                label="Descripción"
                value={form.description}
                edit={editing}
                onChange={(v) => handleChange("description", v)}
              />
            </div>
          </div>
        )}

        {editing && (
          <div className="mt-8 flex justify-end gap-3">
            <Button
              variant="outline"
              leadingIcon={<X size={18} />}
              onClick={() => setEditing(false)}
            >
              Cancelar
            </Button>

            <Button leadingIcon={<Save size={18} />} onClick={handleSave}>
              Guardar
            </Button>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-card border border-gray-200 bg-white p-6 shadow-card sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-brand-50 text-primary">
              <UserRound size={18} />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-gray-900">
                Información del representante
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Datos de tu cuenta. Se editan en Configuración de cuenta.
              </p>
            </div>
          </div>

          <Link
            to="/company/dashboard?tab=profile"
            className={buttonClasses({ variant: "outline", size: "sm", className: "shrink-0" })}
          >
            <Pencil size={15} />
            Editar
          </Link>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {user ? (
            <>
              <ReadOnlyField label="Nombre del representante" value={user.name} />
              <ReadOnlyField label="Teléfono" value={user.tell} />
              <div className="md:col-span-2">
                <ReadOnlyField label="Correo electrónico" value={user.email} />
              </div>
            </>
          ) : (
            Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-12" />
            ))
          )}
        </div>
      </section>
    </>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      <p className="min-h-11 rounded-control border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900">
        {value}
      </p>
    </div>
  );
}

function InputCompany({
  label,
  value,
  edit,
  onChange,
}: {
  label: string;
  value: string;
  edit: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      label={label}
      value={value}
      disabled={!edit}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function TextareaCompany({
  label,
  value,
  edit,
  onChange,
}: {
  label: string;
  value: string;
  edit: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Textarea
      label={label}
      value={value}
      disabled={!edit}
      onChange={(e) => onChange(e.target.value)}
      rows={4}
      maxLength={1000}
      placeholder="Cuéntale a tus clientes a qué se dedica tu empresa…"
    />
  );
}
