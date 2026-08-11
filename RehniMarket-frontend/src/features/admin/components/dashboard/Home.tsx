
import { useEffect, useState } from "react";
import {
  Activity,
  Building2,
  UserRound,
  UserX,
  Mail,
  Store,
  CheckCircle,
} from "lucide-react";

import {
  getAdminDashboardStatistics,
  getRecentAdminActivities,
  getRecentAdminUsers,
} from "@/features/admin/api/dashboardService";

import type {
  AdminDashboardStatisticsResponse,
  AdminRecentActivity,
  AdminRecentUser,
} from "@/features/admin/types/response";

interface HomeProps {
  onNavigate: (view: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const [statistics, setStatistics] =
    useState<AdminDashboardStatisticsResponse | null>(null);

  const [activities, setActivities] =
    useState<AdminRecentActivity[]>([]);

  const [recentUsers, setRecentUsers] =
    useState<AdminRecentUser[]>([]);

  const [loading, setLoading] = useState(true);

  const [activitiesLoading, setActivitiesLoading] =
    useState(true);

  const [recentUsersLoading, setRecentUsersLoading] =
    useState(true);

  const [error, setError] = useState(false);

  /*
   * Se utiliza únicamente para actualizar
   * los tiempos relativos de las actividades.
   *
   * No se ejecuta Date.now() durante el render.
   */
  const [currentTime, setCurrentTime] =
    useState<number | null>(null);

  /*
   * =========================
   * CARGAR ESTADÍSTICAS
   * =========================
   */
  useEffect(() => {
    const loadStatistics = async () => {
      try {
        setLoading(true);
        setError(false);

        const response =
          await getAdminDashboardStatistics();

        setStatistics(response);
      } catch (error) {
        console.error(
          "Error cargando estadísticas del administrador:",
          error,
        );

        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, []);

  /*
   * =========================
   * CARGAR ACTIVIDADES
   * =========================
   */
  useEffect(() => {
    const loadActivities = async () => {
      try {
        setActivitiesLoading(true);

        const response =
          await getRecentAdminActivities();

        setActivities(response);

        /*
         * Obtenemos la hora actual después
         * de recibir los datos.
         */
        setCurrentTime(Date.now());
      } catch (error) {
        console.error(
          "Error cargando actividades recientes:",
          error,
        );
      } finally {
        setActivitiesLoading(false);
      }
    };

    loadActivities();
  }, []);

  /*
   * =========================
   * CARGAR USUARIOS RECIENTES
   * =========================
   */
  useEffect(() => {
    const loadRecentUsers = async () => {
      try {
        setRecentUsersLoading(true);

        const response =
          await getRecentAdminUsers();

        setRecentUsers(response);
      } catch (error) {
        console.error(
          "Error cargando usuarios recientes:",
          error,
        );
      } finally {
        setRecentUsersLoading(false);
      }
    };

    loadRecentUsers();
  }, []);

  /*
   * =========================
   * ACTUALIZAR TIEMPO
   * =========================
   *
   * No vuelve a consultar el backend.
   * Solo actualiza el texto:
   *
   * Hace unos segundos
   * Hace 5 minutos
   * Hace 2 horas
   * Hace 3 días
   */
  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 30_000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  /*
   * =========================
   * VALORES ESTADÍSTICAS
   * =========================
   */
  const getValue = (
    value: number | undefined,
  ) => {
    if (loading) {
      return "...";
    }

    if (error) {
      return "—";
    }

    return String(value ?? 0);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* =========================
          ENCABEZADO
      ========================= */}

      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">
          Inicio
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Resumen general de RehniMarket.
        </p>
      </div>

      {/* =========================
          ERROR
      ========================= */}

      {error && (
        <div className="mt-4 shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">
            No se pudieron cargar las estadísticas.
          </p>
        </div>
      )}

      {/* =========================
          CONTENIDO
      ========================= */}

      <div className="min-h-0 flex-1 overflow-hidden">
        {/* =========================
            USUARIOS
        ========================= */}

        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <UserRound
              size={18}
              className="text-[#7A1833]"
            />

            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
              Usuarios
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              title="Registrados"
              value={getValue(
                statistics?.users,
              )}
            />

            <StatCard
              title="Activos"
              value={getValue(
                statistics?.active_users,
              )}
            />

            <StatCard
              title="Bloqueados"
              value={getValue(
                statistics?.blocked_users,
              )}
            />

            <StatCard
              title="Administradores"
              value={getValue(
                statistics?.administrators,
              )}
            />
          </div>
        </section>

        {/* =========================
            EMPRESAS
        ========================= */}

        <section className="mt-5">
          <div className="mb-3 flex items-center gap-2">
            <Building2
              size={18}
              className="text-[#7A1833]"
            />

            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
              Empresas
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              title="Registradas"
              value={getValue(
                statistics?.companies,
              )}
            />

            <StatCard
              title="Activas"
              value={getValue(
                statistics?.active_companies,
              )}
            />

            <StatCard
              title="Bloqueadas"
              value={getValue(
                statistics?.blocked_companies,
              )}
            />
          </div>
        </section>

        {/* =========================
            USUARIOS + ACTIVIDAD
        ========================= */}

        <section className="mt-5 grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-2">
          {/* =========================
              USUARIOS RECIENTES
          ========================= */}

          <div className="min-h-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="font-semibold text-gray-900">
                  Usuarios recientes
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  Últimos usuarios registrados.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate("users")}
                className="text-sm font-medium text-[#7A1833] transition hover:text-[#64132a]"
              >
                Ver todos →
              </button>
            </div>

            <div className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-5 py-3 font-medium">
                      Usuario
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Rol
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Estado
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentUsersLoading ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-5 py-8 text-center text-sm text-gray-500"
                      >
                        Cargando usuarios...
                      </td>
                    </tr>
                  ) : recentUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-5 py-8 text-center text-sm text-gray-500"
                      >
                        No hay usuarios registrados.
                      </td>
                    </tr>
                  ) : (
                    recentUsers.map((user) => (
                      <UserRow
                        key={user.id}
                        name={user.fullName}
                        email={user.email}
                        role={getRoleLabel(
                          user.role,
                        )}
                        status={
                          user.isActive
                            ? "Activo"
                            : "Bloqueado"
                        }
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* =========================
              ACTIVIDAD RECIENTE
          ========================= */}

          <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 px-5 py-4">
              <div className="rounded-lg bg-gray-100 p-2 text-gray-600">
                <Activity size={18} />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Actividad reciente
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  Últimos movimientos administrativos.
                </p>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {activitiesLoading ? (
                <div className="flex items-center justify-center px-5 py-10">
                  <p className="text-sm text-gray-500">
                    Cargando actividades...
                  </p>
                </div>
              ) : activities.length === 0 ? (
                <div className="flex items-center justify-center px-5 py-10">
                  <p className="text-sm text-gray-500">
                    No hay actividades recientes.
                  </p>
                </div>
              ) : currentTime === null ? (
                <div className="flex items-center justify-center px-5 py-10">
                  <p className="text-sm text-gray-500">
                    Calculando tiempos...
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {activities.map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      title={activity.title}
                      description={activity.description}
                      time={formatRelativeTime(
                        activity.created_at,
                        currentTime,
                      )}
                      type={getActivityType(
                        activity.action,
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/*
 * =========================
 * STAT CARD
 * =========================
 */

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-4">
      <p className="text-xs font-medium text-gray-500">
        {title}
      </p>

      <p className="mt-1 text-2xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

/*
 * =========================
 * USER ROW
 * =========================
 */

function UserRow({
  name,
  email,
  role,
  status,
}: {
  name: string;
  email: string;
  role: string;
  status: "Activo" | "Bloqueado";
}) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-5 py-3">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {name}
          </p>

          <p className="mt-0.5 text-xs text-gray-400">
            {email}
          </p>
        </div>
      </td>

      <td className="px-5 py-3">
        <span className="text-sm text-gray-600">
          {role}
        </span>
      </td>

      <td className="px-5 py-3">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            status === "Activo"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {status}
        </span>
      </td>
    </tr>
  );
}

/*
 * =========================
 * ROLE LABEL
 * =========================
 */

function getRoleLabel(role: string): string {
  switch (role) {
    case "admin":
      return "Administrador";

    case "company":
      return "Empresa";

    case "user":
      return "Usuario";

    default:
      return role;
  }
}

/*
 * =========================
 * ACTIVITY ITEM
 * =========================
 */

function ActivityItem({
  title,
  description,
  time,
  type,
}: {
  title: string;
  description: string;
  time: string;
  type:
    | "success"
    | "info"
    | "danger"
    | "company";
}) {
  const iconStyles = {
    success: "bg-green-50 text-green-600",
    info: "bg-blue-50 text-blue-600",
    danger: "bg-red-50 text-red-600",
    company: "bg-gray-100 text-gray-600",
  };

  const icons = {
    success: <CheckCircle size={16} />,
    info: <Mail size={16} />,
    danger: <UserX size={16} />,
    company: <Store size={16} />,
  };

  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          iconStyles[type]
        }`}
      >
        {icons[type]}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">
          {title}
        </p>

        <p className="mt-0.5 text-sm text-gray-500">
          {description}
        </p>

        <p className="mt-1 text-xs text-gray-400">
          {time}
        </p>
      </div>
    </div>
  );
}

/*
 * =========================
 * ACTIVITY TYPE
 * =========================
 */

function getActivityType(
  action: AdminRecentActivity["action"],
): "success" | "info" | "danger" | "company" {
  if (action.startsWith("company_")) {
    return "company";
  }

  if (action === "user_blocked") {
    return "danger";
  }

  if (action === "user_updated") {
    return "info";
  }

  return "success";
}

/*
 * =========================
 * RELATIVE TIME
 * =========================
 */

function formatRelativeTime(
  dateString: string,
  currentTime: number,
): string {
  /*
   * PostgreSQL:
   *
   * timestamp with time zone
   *
   * Ejemplo:
   *
   * 2026-08-10T01:05:49.49835+00:00
   */

  let normalizedDate = dateString;

  /*
   * Compatibilidad con fechas antiguas
   * que puedan llegar sin timezone.
   *
   * En ese caso las tratamos como UTC.
   */
  if (
    !dateString.endsWith("Z") &&
    !dateString.includes("+") &&
    !/[+-]\d{2}:\d{2}$/.test(dateString)
  ) {
    normalizedDate = `${dateString}Z`;
  }

  const activityDate =
    new Date(normalizedDate);

  if (Number.isNaN(activityDate.getTime())) {
    return "Fecha inválida";
  }

  const difference = Math.max(
    0,
    currentTime - activityDate.getTime(),
  );

  const seconds = Math.floor(
    difference / 1000,
  );

  if (seconds < 60) {
    return "Hace unos segundos";
  }

  const minutes = Math.floor(
    seconds / 60,
  );

  if (minutes < 60) {
    return `Hace ${minutes} ${
      minutes === 1
        ? "minuto"
        : "minutos"
    }`;
  }

  const hours = Math.floor(
    minutes / 60,
  );

  const remainingMinutes =
    minutes % 60;

  if (hours < 24) {
    if (remainingMinutes === 0) {
      return `Hace ${hours} ${
        hours === 1
          ? "hora"
          : "horas"
      }`;
    }

    return `Hace ${hours} ${
      hours === 1
        ? "hora"
        : "horas"
    } y ${remainingMinutes} ${
      remainingMinutes === 1
        ? "minuto"
        : "minutos"
    }`;
  }

  const days = Math.floor(
    hours / 24,
  );

  const remainingHours =
    hours % 24;

  if (days < 30) {
    if (remainingHours === 0) {
      return `Hace ${days} ${
        days === 1
          ? "día"
          : "días"
      }`;
    }

    return `Hace ${days} ${
      days === 1
        ? "día"
        : "días"
    } y ${remainingHours} ${
      remainingHours === 1
        ? "hora"
        : "horas"
    }`;
  }

  const months = Math.floor(
    days / 30,
  );

  const remainingDays =
    days % 30;

  if (remainingDays === 0) {
    return `Hace ${months} ${
      months === 1
        ? "mes"
        : "meses"
    }`;
  }

  return `Hace ${months} ${
    months === 1
      ? "mes"
      : "meses"
  } y ${remainingDays} ${
    remainingDays === 1
      ? "día"
      : "días"
  }`;
}

