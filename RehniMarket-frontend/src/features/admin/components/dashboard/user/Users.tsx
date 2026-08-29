
import {
  Search,
  Eye,
  Lock,
  Unlock,
  Trash2,
  Coins,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Badge, Button, EmptyState, ErrorState, Input, TableSkeleton } from "@/shared/components/ui";
import UserDetailModal from "./UserDetailModal";
import UserStatusConfirmModal from "./UserStatusConfirmModal";
import ConfirmModal from "@/shared/components/ConfirmModal";
import RechargeWalletModal from "./RechargeWalletModal";

import {
  getAdminUsers,
  toggleAdminUserStatus,
  deleteAdminUser,
} from "@/features/admin/api/userService";

import type { AdminUserResponse } from "@/features/admin/types/response";
import { useRole } from "@/hooks/useRole";

export default function Users() {
  // Solo para mostrar/ocultar acciones; el backend hace cumplir las reglas.
  const { isOwner } = useRole();

  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

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

  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
  const [selectedRechargeUser, setSelectedRechargeUser] =
    useState<AdminUserResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadInitialUsers = async () => {
      try {
        setLoading(true);
        setFailed(false);

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
          setFailed(true);
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

  const loadUsers = async (
    cursor?: string,
    beforeCursor?: string,
    currentSearch: string = search,
  ) => {
    try {
      setLoading(true);
      setFailed(false);

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
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (value: string) => {
    setSearch(value);

    await loadUsers(
      undefined,
      undefined,
      value,
    );
  };

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

  // Owner no se elimina desde aquí; admin solo lo elimina un owner. El backend aplica lo mismo.
  const canDeleteUser = (user: AdminUserResponse) => {
    if (user.role === "owner") return false;
    if (user.role === "admin") return isOwner;
    return true;
  };

  const handleOpenDeleteModal = (
    user: AdminUserResponse,
  ) => {
    if (!canDeleteUser(user)) return;

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

    if (!canDeleteUser(selectedDeleteUser)) {
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

      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">
          Usuarios
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Gestiona los usuarios registrados
          en la plataforma.
        </p>
      </div>

      <section className="mt-6 shrink-0 rounded-card border border-gray-200 bg-white p-5 shadow-card">
        <Input
          type="search"
          value={search}
          onChange={(event) => handleSearch(event.target.value)}
          placeholder="Buscar usuario, correo o teléfono…"
          aria-label="Buscar usuarios"
          leadingIcon={<Search size={16} />}
        />
      </section>

      <section className="mt-6 flex flex-col overflow-hidden rounded-card border border-gray-200 bg-white shadow-card">

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
                  <td colSpan={7} className="p-0">
                    <TableSkeleton rows={6} columns={["26%", "20%", "16%", "14%", "12%", "8%"]} />
                  </td>
                </tr>
              ) : failed && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <ErrorState
                      variant="plain"
                      title="No pudimos cargar los usuarios"
                      onRetry={() => loadUsers()}
                    />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <EmptyState variant="plain" title="No se encontraron usuarios" />
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >

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

                    <td className="px-5 py-3 text-sm text-gray-600">
                      {user.email}
                    </td>

                    <td className="px-5 py-3 text-sm text-gray-600">
                      {user.tell}
                    </td>

                    <td className="px-5 py-3">
                      <RoleStatus
                        role={user.role}
                      />
                    </td>

                    <td className="px-5 py-3">
                      <UserStatus
                        active={user.isActive}
                      />
                    </td>

                    <td className="px-5 py-3 text-sm text-gray-500">
                      {new Date(
                        user.created_at,
                      ).toLocaleDateString(
                        "es-CO",
                      )}
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedUserId(
                              user.id,
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-control text-gray-600 transition hover:bg-gray-100"
                          title="Ver usuario"
                          aria-label={`Ver ${user.fullName}`}
                        >
                          <Eye size={18} />
                        </button>

                        {(user.role !== "owner" || isOwner) && (
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenStatusModal(
                                user,
                              )
                            }
                            className={`flex h-9 w-9 items-center justify-center rounded-control transition ${
                              user.isActive
                                ? "text-danger hover:bg-danger-bg"
                                : "text-success hover:bg-success-bg"
                            }`}
                            title={
                              user.isActive
                                ? "Bloquear usuario"
                                : "Desbloquear usuario"
                            }
                            aria-label={
                              user.isActive
                                ? `Bloquear ${user.fullName}`
                                : `Desbloquear ${user.fullName}`
                            }
                          >
                            {user.isActive ? (
                              <Lock size={18} />
                            ) : (
                              <Unlock size={18} />
                            )}
                          </button>
                        )}

                        {/* RECARGAR REHNICOIN (solo compradores) */}

                        {user.role === "user" && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRechargeUser(user);
                              setRechargeModalOpen(true);
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-control text-gray-600 transition hover:bg-gray-100"
                            title="Recargar RehniCoin"
                            aria-label={`Recargar RehniCoin de ${user.fullName}`}
                          >
                            <Coins size={18} />
                          </button>
                        )}

                        {canDeleteUser(user) && (
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenDeleteModal(
                                user,
                              )
                            }
                            disabled={deleteLoading}
                            className="flex h-9 w-9 items-center justify-center rounded-control text-danger transition hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-50"
                            title="Eliminar usuario"
                            aria-label={`Eliminar ${user.fullName}`}
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

        <div className="flex shrink-0 items-center justify-between border-t border-gray-200 px-5 py-3">
          <span className="text-xs text-gray-500">
            Mostrando {users.length} usuarios
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={!hasPrevious || loading}
            >
              Anterior
            </Button>

            <Button
              size="sm"
              onClick={handleNextPage}
              disabled={!hasNext}
              loading={loading}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </section>

      <UserDetailModal
        userId={selectedUserId}
        isOpen={selectedUserId !== null}
        onClose={() =>
          setSelectedUserId(null)
        }
      />

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

      {selectedDeleteUser && (
        <ConfirmModal
          isOpen={deleteModalOpen}
          title="Eliminar usuario"
          tone="danger"
          confirmLabel="Eliminar usuario"
          loading={deleteLoading}
          onConfirm={handleConfirmDelete}
          onClose={handleCloseDeleteModal}
          message={
            <>
              Estás a punto de eliminar la cuenta de{" "}
              <span className="font-semibold text-gray-900">
                {selectedDeleteUser.fullName}
              </span>
              .{" "}
              <span className="font-medium text-danger">
                Esta acción no se puede deshacer.
              </span>
            </>
          }
        />
      )}

      {selectedRechargeUser && (
        <RechargeWalletModal
          isOpen={rechargeModalOpen}
          userId={selectedRechargeUser.id}
          userName={selectedRechargeUser.fullName}
          onClose={() => {
            setRechargeModalOpen(false);
            setSelectedRechargeUser(null);
          }}
        />
      )}
    </div>
  );
}

function UserStatus({
  active,
}: {
  active: boolean;
}) {
  return (
    <Badge tone={active ? "success" : "danger"}>
      {active ? "Activo" : "Bloqueado"}
    </Badge>
  );
}

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
          : role === "owner"
            ? "Propietario"
            : role;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        role === "owner"
          ? "bg-primary text-primary-fg"
          : role === "admin"
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

