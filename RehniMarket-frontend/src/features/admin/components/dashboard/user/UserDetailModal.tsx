import {
  Mail,
  Phone,
  Shield,
  CalendarDays,
  Pencil,
  Save,
  XCircle,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Spinner } from "@/shared/components/ui";

import {
  getAdminUserById,
  updateAdminUser,
} from "@/features/admin/api/userService";

import type { AdminUserResponse } from "@/features/admin/types/response";
import type { UpdateAdminUserRequest } from "@/features/admin/types/request";
import { useRole } from "@/hooks/useRole";

interface UserDetailModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

type EditableRole = "user" | "admin" | "company" | "owner";

function getRoleLabel(role: string): string {
  switch (role) {
    case "user":
      return "Usuario";
    case "admin":
      return "Administrador";
    case "company":
      return "Empresa";
    case "owner":
      return "Propietario";
    default:
      return role;
  }
}

export default function UserDetailModal({
  userId,
  isOpen,
  onClose,
}: UserDetailModalProps) {
  const { isOwner } = useRole();

  const [user, setUser] = useState<AdminUserResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<EditableRole>("user");

  useEffect(() => {
    if (!isOpen || !userId) {
      return;
    }

    const loadUser = async () => {
      try {
        setLoading(true);
        setUser(null);
        setIsEditing(false);

        const response = await getAdminUserById(userId);

        setUser(response);
        setEditEmail(response.email);
        setEditRole(response.role as EditableRole);
      } catch (error) {
        console.error("Error cargando usuario:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [isOpen, userId]);

  if (!isOpen) {
    return null;
  }

  const handleEdit = () => {
    if (!user) {
      return;
    }

    setEditEmail(user.email);
    setEditRole(user.role as EditableRole);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (!user) {
      return;
    }

    setEditEmail(user.email);
    setEditRole(user.role as EditableRole);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!user || !userId) {
      return;
    }

    const email = editEmail.trim();

    if (!email) {
      return;
    }

    const data: UpdateAdminUserRequest = {};

    if (email !== user.email) {
      data.email = email;
    }

    const isAssignableRole =
      editRole === "user" ||
      editRole === "admin" ||
      (editRole === "owner" && isOwner);

    if (
      user.role !== "company" &&
      editRole !== user.role &&
      isAssignableRole
    ) {
      data.role = editRole;
    }

    if (
      data.email === undefined &&
      data.role === undefined
    ) {
      setIsEditing(false);
      return;
    }

    try {
      setSaving(true);

      const response = await updateAdminUser(userId, data);

      setUser(response);
      setEditEmail(response.email);
      setEditRole(response.role as EditableRole);
      setIsEditing(false);
    } catch (error) {
      console.error("Error actualizando usuario:", error);
    } finally {
      setSaving(false);
    }
  };

  const canEditRole = user?.role !== "company";

  const canEdit = !(user?.role === "owner" && !isOwner);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-card bg-surface-1 shadow-xl">

        <div className="shrink-0 border-b border-gray-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isEditing
                ? "Editar información"
                : "Detalle de usuario"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {isEditing
                ? "Modifica el correo y el rol del usuario."
                : "Información del usuario registrado."}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500">
              <Spinner /> Cargando usuario...
            </div>
          )}

          {!loading && user && (
            <div className="p-6">

              <div className="flex items-center gap-5 rounded-card border border-gray-200 p-5">
                {user.profileImagen ? (
                  <img
                    src={user.profileImagen}
                    alt={user.fullName}
                    className="h-20 w-20 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-2xl font-bold text-gray-500">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {user.fullName}
                  </h3>

                  <p className="mt-1 truncate text-gray-500">
                    {user.email}
                  </p>

                  <div className="mt-3">
                    <UserStatus active={user.isActive} />
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">

                <InfoCard
                  icon={<Pencil size={20} />}
                  title="Nombre completo"
                  value={user.fullName}
                />

                {isEditing ? (
                  <EditField
                    icon={<Mail size={20} />}
                    title="Correo"
                    type="email"
                    value={editEmail}
                    onChange={setEditEmail}
                    disabled={saving}
                  />
                ) : (
                  <InfoCard
                    icon={<Mail size={20} />}
                    title="Correo"
                    value={user.email}
                  />
                )}

                <InfoCard
                  icon={<Phone size={20} />}
                  title="Teléfono"
                  value={user.tell}
                />

                {isEditing && canEditRole ? (
                  <EditSelect
                    icon={<Shield size={20} />}
                    title="Rol"
                    value={editRole}
                    onChange={(value) =>
                      setEditRole(value as EditableRole)
                    }
                    disabled={saving}
                    options={[
                      {
                        value: "user",
                        label: "Usuario",
                      },
                      {
                        value: "admin",
                        label: "Administrador",
                      },
                      ...(isOwner
                        ? [
                            {
                              value: "owner",
                              label: "Propietario",
                            },
                          ]
                        : []),
                    ]}
                  />
                ) : (
                  <InfoCard
                    icon={<Shield size={20} />}
                    title="Rol"
                    value={getRoleLabel(user.role)}
                  />
                )}

                <InfoCard
                  icon={<CalendarDays size={20} />}
                  title="Fecha de registro"
                  value={new Date(
                    user.created_at,
                  ).toLocaleDateString("es-CO")}
                />
              </div>

              {isEditing && user.role === "company" && (
                <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <Shield
                      size={18}
                      className="mt-0.5 shrink-0 text-gray-500"
                    />

                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Rol protegido
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        El rol de una empresa no puede
                        modificarse desde esta sección.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isEditing &&
                user.role === "user" &&
                editRole === "admin" && (
                  <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <Shield
                        size={18}
                        className="mt-0.5 shrink-0 text-gray-500"
                      />

                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Cambio de rol
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          Al convertirse en administrador,
                          este usuario dejará de poder
                          realizar nuevas compras. Sus
                          pedidos anteriores se conservarán.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {isEditing &&
                user.role === "admin" &&
                editRole === "user" && (
                  <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <Shield
                        size={18}
                        className="mt-0.5 shrink-0 text-gray-500"
                      />

                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Cambio de rol
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          Al volver a ser usuario, recuperará
                          la posibilidad de realizar compras.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              <div className="mt-6 rounded-card border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900">
                  Acciones
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  {!canEdit
                    ? "Solo un Owner puede gestionar esta cuenta."
                    : isEditing
                      ? "Guarda o cancela los cambios realizados."
                      : "Gestiona la información del usuario."}
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 rounded-xl bg-surface-2 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Save size={18} />

                        {saving
                          ? "Guardando…"
                          : "Guardar cambios"}
                      </button>

                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <XCircle size={18} />
                        Cancelar
                      </button>
                    </>
                  ) : (
                    canEdit && (
                      <button
                        type="button"
                        onClick={handleEdit}
                        className="flex items-center justify-center gap-2 rounded-xl bg-surface-2 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-surface-3"
                      >
                        <Pencil size={18} />
                        Editar información
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {!loading && !user && (
            <div className="p-12 text-center text-gray-500">
              No se pudo cargar la información del usuario.
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-gray-200 px-6 py-5">
          <button
            type="button"
            onClick={() => {
              if (isEditing) {
                handleCancelEdit();
              } else {
                onClose();
              }
            }}
            disabled={saving}
            className="rounded-xl border border-gray-300 px-5 py-2 text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isEditing ? "Cancelar" : "Cerrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  value,
}: {
  icon: ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-card border border-gray-200 p-5">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-sm font-medium">
          {title}
        </span>
      </div>

      <p className="mt-3 font-semibold text-gray-900">
        {value || "No disponible"}
      </p>
    </div>
  );
}

function EditField({
  icon,
  title,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-card border border-gray-200 p-5">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-sm font-medium">
          {title}
        </span>
      </div>

      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-3 w-full rounded-xl border border-gray-300 bg-surface-1 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-100"
      />
    </div>
  );
}

function EditSelect({
  icon,
  title,
  value,
  onChange,
  options,
  disabled = false,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
  disabled?: boolean;
}) {
  return (
    <div className="rounded-card border border-gray-200 p-5">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-sm font-medium">
          {title}
        </span>
      </div>

      <select
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-3 w-full rounded-xl border border-gray-300 bg-surface-1 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-100"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function UserStatus({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        active
          ? "bg-success-bg text-success"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      {active ? "Activo" : "Bloqueado"}
    </span>
  );
}
