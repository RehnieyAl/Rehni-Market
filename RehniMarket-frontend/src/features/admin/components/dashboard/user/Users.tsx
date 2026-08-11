
import {
  Search,
  Eye,
  Lock,
  Unlock,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

import UserDetailModal from "./UserDetailModal";
import UserStatusConfirmModal from "./UserStatusConfirmModal";
import UserDeleteConfirmModal from "./UserDeleteConfirmModal";

import {
  getAdminUsers,
  toggleAdminUserStatus,
  deleteAdminUser,
} from "@/features/admin/api/userService";

import type { AdminUserResponse } from "@/features/admin/types/response";

export default function Users() {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [previousCursor, setPreviousCursor] = useState<string | null>(null);

  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedStatusUser, setSelectedStatusUser] =
    useState<AdminUserResponse | null>(null);

  const [statusLoading, setStatusLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDeleteUser, setSelectedDeleteUser] =
    useState<AdminUserResponse | null>(null);

  const [deleteLoading, setDeleteLoading] = useState(false);

  // =========================
  // CARGA INICIAL
  // =========================

  useEffect(() => {
    let cancelled = false;

    const loadInitialUsers = async () => {
      try {
        setLoading(true);

        const response = await getAdminUsers(
          10,
          undefined,
          undefined,
          "",
        );

        if (cancelled) return;

        setUsers(response.items);
        setNextCursor(response.next_cursor);
        setPreviousCursor(response.previous_cursor);
        setHasNext(response.has_next);
        setHasPrevious(response.has_previous);
      } catch (error) {
        if (!cancelled) {
          console.error("Error cargando usuarios:", error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadInitialUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================
  // CARGAR USUARIOS
  // =========================

  const loadUsers = async (
    cursor?: string,
    beforeCursor?: string,
    currentSearch: string = search,
  ) => {
    try {
      setLoading(true);

      const response = await getAdminUsers(
        10,
        cursor,
        beforeCursor,
        currentSearch,
      );

      setUsers(response.items);
      setNextCursor(response.next_cursor);
      setPreviousCursor(response.previous_cursor);
      setHasNext(response.has_next);
      setHasPrevious(response.has_previous);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // BUSCAR
  // =========================

  const handleSearch = async (value: string) => {
    setSearch(value);

    await loadUsers(
      undefined,
      undefined,
      value,
    );
  };

  // =========================
  // PAGINACIÓN
  // =========================

  const handleNextPage = async () => {
    if (!nextCursor || loading) return;

    await loadUsers(
      nextCursor,
      undefined,
      search,
    );
  };

  const handlePreviousPage = async () => {
    if (!previousCursor || loading) return;

    await loadUsers(
      undefined,
      previousCursor,
      search,
    );
  };

  // =========================
  // ESTADO
  // =========================

  const handleOpenStatusModal = (
    user: AdminUserResponse,
  ) => {
    setSelectedStatusUser(user);
    setStatusModalOpen(true);
  };

  const handleCloseStatusModal = () => {
    if (statusLoading) return;

    setStatusModalOpen(false);
    setSelectedStatusUser(null);
  };

  const handleConfirmStatus = async () => {
    if (!selectedStatusUser) return;

    try {
      setStatusLoading(true);

      const response =
        await toggleAdminUserStatus(
          selectedStatusUser.id,
        );

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === response.id
            ? response
            : user,
        ),
      );

      setStatusModalOpen(false);
      setSelectedStatusUser(null);
    } catch (error) {
      console.error(
        "Error actualizando estado:",
        error,
      );
    } finally {
      setStatusLoading(false);
    }
  };

  // =========================
  // ELIMINAR
  // =========================

  const handleOpenDeleteModal = (
    user: AdminUserResponse,
  ) => {
    // No permitir eliminar administradores
    if (user.role === "admin") return;

    setSelectedDeleteUser(user);
    setDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    if (deleteLoading) return;

    setDeleteModalOpen(false);
    setSelectedDeleteUser(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDeleteUser) return;

    // Protección adicional
    if (selectedDeleteUser.role === "admin") {
      return;
    }

    try {
      setDeleteLoading(true);

      await deleteAdminUser(
        selectedDeleteUser.id,
      );

      setUsers((currentUsers) =>
        currentUsers.filter(
          (user) =>
            user.id !== selectedDeleteUser.id,
        ),
      );

      setDeleteModalOpen(false);
      setSelectedDeleteUser(null);
    } catch (error) {
      console.error(
        "Error eliminando usuario:",
        error,
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="shrink-0">
      {/* =========================
          ENCABEZADO
      ========================= */}

      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">
          Usuarios
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Gestiona los usuarios registrados
          en la plataforma.
        </p>
      </div>

      {/* =========================
          BUSCADOR
      ========================= */}

      <section className="mt-6 shrink-0 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-2.5">
          <Search
            size={18}
            className="text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              handleSearch(event.target.value)
            }
            placeholder="Buscar usuario, correo o teléfono..."
            className="w-full text-sm outline-none"
          />
        </div>
      </section>

      {/* =========================
          TABLA
      ========================= */}

      <section className="mt-6 flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* HEADER */}

        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Usuarios registrados
            </h2>

            <p className="mt-0.5 text-xs text-gray-500">
              {users.length} usuario
              {users.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* =========================
            CONTENEDOR DE TABLA
            SCROLL SOLO AQUÍ
        ========================= */}

        <div className="h-[360px] overflow-y-auto overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">
                  Usuario
                </th>

                <th className="px-5 py-3 font-medium">
                  Correo
                </th>

                <th className="px-5 py-3 font-medium">
                  Teléfono
                </th>

                <th className="px-5 py-3 font-medium">
                  Rol
                </th>

                <th className="px-5 py-3 font-medium">
                  Estado
                </th>

                <th className="px-5 py-3 font-medium">
                  Registro
                </th>

                <th className="px-5 py-3 text-center font-medium">
                  Acción
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-8 text-center text-sm text-gray-500"
                  >
                    Cargando usuarios...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-8 text-center text-sm text-gray-500"
                  >
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    {/* USUARIO */}

                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {user.profileImagen ? (
                          <img
                            src={user.profileImagen}
                            alt={user.fullName}
                            className="h-9 w-9 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-sm font-semibold text-gray-500">
                            {user.fullName
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}

                        <span className="text-sm font-medium text-gray-900">
                          {user.fullName}
                        </span>
                      </div>
                    </td>

                    {/* CORREO */}

                    <td className="px-5 py-3 text-sm text-gray-600">
                      {user.email}
                    </td>

                    {/* TELÉFONO */}

                    <td className="px-5 py-3 text-sm text-gray-600">
                      {user.tell}
                    </td>

                    {/* ROL */}

                    <td className="px-5 py-3">
                      <RoleStatus
                        role={user.role}
                      />
                    </td>

                    {/* ESTADO */}

                    <td className="px-5 py-3">
                      <UserStatus
                        active={user.isActive}
                      />
                    </td>

                    {/* REGISTRO */}

                    <td className="px-5 py-3 text-sm text-gray-500">
                      {new Date(
                        user.created_at,
                      ).toLocaleDateString(
                        "es-CO",
                      )}
                    </td>

                    {/* ACCIONES */}

                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {/* VER */}

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedUserId(
                              user.id,
                            )
                          }
                          className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
                          title="Ver usuario"
                        >
                          <Eye size={18} />
                        </button>

                        {/* BLOQUEAR / DESBLOQUEAR */}

                        <button
                          type="button"
                          onClick={() =>
                            handleOpenStatusModal(
                              user,
                            )
                          }
                          className={`rounded-lg p-2 transition ${
                            user.isActive
                              ? "text-red-600 hover:bg-red-50"
                              : "text-green-600 hover:bg-green-50"
                          }`}
                          title={
                            user.isActive
                              ? "Bloquear usuario"
                              : "Desbloquear usuario"
                          }
                        >
                          {user.isActive ? (
                            <Lock size={18} />
                          ) : (
                            <Unlock size={18} />
                          )}
                        </button>

                        {/* ELIMINAR */}

                        {user.role !== "admin" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenDeleteModal(
                                user,
                              )
                            }
                            disabled={deleteLoading}
                            className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Eliminar usuario"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* =========================
            PAGINACIÓN
        ========================= */}

        <div className="flex shrink-0 items-center justify-between border-t border-gray-200 px-5 py-3">
          <span className="text-xs text-gray-500">
            Mostrando {users.length} usuarios
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePreviousPage}
              disabled={
                !hasPrevious || loading
              }
              className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={!hasNext || loading}
              className="rounded-lg bg-[#7A1833] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#64132a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Cargando..."
                : "Siguiente"}
            </button>
          </div>
        </div>
      </section>

      {/* =========================
          MODAL DETALLE
      ========================= */}

      <UserDetailModal
        userId={selectedUserId}
        isOpen={selectedUserId !== null}
        onClose={() =>
          setSelectedUserId(null)
        }
      />

      {/* =========================
          MODAL ESTADO
      ========================= */}

      {selectedStatusUser && (
        <UserStatusConfirmModal
          isOpen={statusModalOpen}
          userName={
            selectedStatusUser.fullName
          }
          active={
            selectedStatusUser.isActive
          }
          loading={statusLoading}
          onConfirm={handleConfirmStatus}
          onClose={handleCloseStatusModal}
        />
      )}

      {/* =========================
          MODAL ELIMINAR
      ========================= */}

      {selectedDeleteUser && (
        <UserDeleteConfirmModal
          isOpen={deleteModalOpen}
          userName={
            selectedDeleteUser.fullName
          }
          loading={deleteLoading}
          onConfirm={handleConfirmDelete}
          onClose={handleCloseDeleteModal}
        />
      )}
    </div>
  );
}

// =========================
// ESTADO DEL USUARIO
// =========================

function UserStatus({
  active,
}: {
  active: boolean;
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-green-50 text-green-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      {active ? "Activo" : "Bloqueado"}
    </span>
  );
}

// =========================
// ROL DEL USUARIO
// =========================

function RoleStatus({
  role,
}: {
  role: string;
}) {
  const roleLabel =
    role === "user"
      ? "Usuario"
      : role === "admin"
        ? "Administrador"
        : role === "company"
          ? "Empresa"
          : role;

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        role === "admin"
          ? "bg-gray-900 text-white"
          : role === "company"
            ? "bg-gray-200 text-gray-700"
            : "bg-gray-100 text-gray-700"
      }`}
    >
      {roleLabel}
    </span>
  );
}

