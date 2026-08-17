
import { useEffect, useState } from "react";
import { Upload, Download, Pencil, Save, X } from "lucide-react";

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
  const [editing, setEditing] = useState(false);

  const [media, setMedia] = useState<CompanyMediaUpload>({});

  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [previewBanner, setPreviewBanner] = useState<string | null>(null);

  const [company, setCompany] =
    useState<CompanyProfileResponse | null>(null);

  // Solo información pública de la tienda - el correo (y cualquier otro
  // dato de la cuenta) se gestiona en "Configuración de cuenta"
  // (ver Profile.tsx), no aquí.
  const [form, setForm] = useState({
    nameCompany: "",
    addressCompany: "",
    tellCompany: "",
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
          tellCompany: data.tellCompany,
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
      const response = await updateMyCompanyProfile(form);

      setCompany({
        ...company!,
        ...response,
      });

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

      console.log("Logo y banner actualizados");
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
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Mi tienda
        </h1>

        <p className="mt-2 text-gray-500">
          Administra la información pública de tu empresa.
        </p>

        {/* Reputación real, calculada sobre las reseñas activas de todos
            los productos de la empresa (ver ALCANCE > Calificaciones de
            empresa) - la empresa no tiene reseñas propias. */}
        {company && <CompanyRatingBadge companyId={company.id} className="mt-3" />}
      </div>

      {/* IMAGEN EMPRESA */}
      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">
          Imagen de la empresa
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Personaliza la imagen que verán tus clientes.
        </p>

        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          {/* LOGO */}
          <div className="flex flex-col items-center">
            <h3 className="mb-6 font-medium text-gray-800">
              Logo empresa
            </h3>

            <div className="h-40 w-40 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg">
              <img
                src={previewLogo || company?.logo || defaultLogo}
                alt="Logo empresa"
                className="h-full w-full object-cover"
              />
            </div>

            <label className="mt-6 flex h-12 w-72 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-700 text-white hover:bg-red-800">
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
              <p className="mt-3 text-sm text-green-700">
                Imagen seleccionada: {media.photo_profile.name}
              </p>
            )}

            <button
              onClick={() =>
                handleDownloadTemplate(
                  logoTemplate,
                  "example-logo.webp",
                )
              }
              className="mt-3 flex h-12 w-72 items-center justify-center gap-2 rounded-xl border border-red-700 text-red-700 hover:bg-red-50"
            >
              <Download size={18} />

              Descargar plantilla
            </button>
          </div>

          {/* BANNER */}
          <div>
            <h3 className="mb-6 text-center font-medium text-gray-800">
              Banner empresa
            </h3>

            <div className="overflow-hidden rounded-xl border border-gray-200 shadow-md">
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

            <label className="mt-6 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-700 text-white hover:bg-red-800">
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
              <p className="mt-3 text-sm text-green-700">
                Banner seleccionado:{" "}
                {media.banner_profile.name}
              </p>
            )}

            <button
              onClick={() =>
                handleDownloadTemplate(
                  bannerTemplate,
                  "example-banner.jpg",
                )
              }
              className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-700 text-red-700 hover:bg-red-50"
            >
              <Download size={18} />

              Descargar plantilla
            </button>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleUpdateMedia}
            disabled={
              !media.photo_profile &&
              !media.banner_profile
            }
            className="flex items-center gap-2 rounded-xl bg-red-700 px-6 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={18} />

            Actualizar imágenes
          </button>
        </div>
      </section>

      {/* INFORMACIÓN */}
      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Información de la tienda
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Datos públicos de tu empresa.
            </p>
          </div>

          {!editing && (
            <button
              onClick={() => {
                if (company) {
                  setForm({
                    nameCompany: company.nameCompany,
                    addressCompany: company.addressCompany,
                    tellCompany: company.tellCompany,
                    description: company.description ?? "",
                  });
                }

                setEditing(true);
              }}
              className="rounded-xl p-3 hover:bg-gray-100"
            >
              <Pencil size={20} />
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-gray-500">
            Cargando información...
          </p>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <InputCompany
              label="Nombre empresa"
              value={form.nameCompany}
              edit={editing}
              onChange={(v) =>
                handleChange("nameCompany", v)
              }
            />

            <InputCompany
              label="Dirección"
              value={form.addressCompany}
              edit={editing}
              onChange={(v) =>
                handleChange("addressCompany", v)
              }
            />

            <InputCompany
              label="Teléfono"
              value={form.tellCompany}
              edit={editing}
              onChange={(v) =>
                handleChange("tellCompany", v)
              }
            />

            <div className="md:col-span-2">
              <TextareaCompany
                label="Descripción"
                value={form.description}
                edit={editing}
                onChange={(v) =>
                  handleChange("description", v)
                }
              />
            </div>
          </div>
        )}

        {editing && (
          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-2 rounded-xl border px-6 py-3"
            >
              <X size={18} />

              Cancelar
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-2 rounded-xl bg-red-700 px-6 py-3 text-white"
            >
              <Save size={18} />

              Guardar
            </button>
          </div>
        )}
      </section>
    </>
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
    <div>
      <label className="font-medium text-gray-700">
        {label}
      </label>

      <input
        value={value}
        disabled={!edit}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 disabled:bg-gray-100"
      />
    </div>
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
    <div>
      <label className="font-medium text-gray-700">
        {label}
      </label>

      <textarea
        value={value}
        disabled={!edit}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        maxLength={1000}
        placeholder="Cuéntale a tus clientes a qué se dedica tu empresa..."
        className="mt-2 w-full resize-none rounded-xl border border-gray-300 px-4 py-3 disabled:bg-gray-100"
      />
    </div>
  );
}

