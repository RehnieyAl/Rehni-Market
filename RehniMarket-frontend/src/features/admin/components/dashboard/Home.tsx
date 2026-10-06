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
import { useAlert } from "@/shared/components/alert/useAlert";
import { Badge, EmptyState, Skeleton, Spinner, TableSkeleton } from "@/shared/components/ui";
import StatCard from "@/shared/components/dashboard/StatCard";

import type {
  AdminDashboardStatisticsResponse,
  AdminRecentActivity,
  AdminRecentUser,
} from "@/features/admin/types/response";

interface HomeProps {
  onNavigate: (view: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const { showAlert } = useAlert();

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

  const [statsFailed, setStatsFailed] = useState(false);

  const [currentTime, setCurrentTime] =
    useState<number | null>(null);

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        setLoading(true);
        setStatsFailed(false);

        const response =
          await getAdminDashboardStatistics();

        setStatistics(response);
      } catch (error) {
        console.error(
          "Error cargando estadísticas del administrador:",
          error,
        );

        setStatsFailed(true);
        showAlert("error", "No se pudieron cargar las estadísticas.");
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, []);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        setActivitiesLoading(true);

        const response =
          await getRecentAdminActivities();

        setActivities(response);

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

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 30_000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const getValue = (
    value: number | undefined,
  ) => {
    if (loading) {
      return "…";
    }

    if (statsFailed) {
      return "—";
    }

    return String(value ?? 0);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">
          Inicio
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Resumen general de RehniMarket.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <UserRound
              size={18}
              className="text-primary"
            />

            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
              Usuarios
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              size="sm"
              title="Registrados"
              value={getValue(
                statistics?.users,
              )}
            />

            <StatCard
              size="sm"
              title="Activos"
              value={getValue(
                statistics?.active_users,
              )}
            />

            <StatCard
              size="sm"
              title="Bloqueados"
              value={getValue(
                statistics?.blocked_users,
              )}
            />

            <StatCard
              size="sm"
              title="Administradores"
              value={getValue(
                statistics?.administrators,
              )}
            />
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-3 flex items-center gap-2">
            <Building2
              size={18}
              className="text-primary"
            />

            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
              Empresas
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              size="sm"
              title="Registradas"
              value={getValue(
                statistics?.companies,
              )}
            />

            <StatCard
              size="sm"
              title="Activas"
              value={getValue(
                statistics?.active_companies,
              )}
            />

            <StatCard
              size="sm"
              title="Bloqueadas"
              value={getValue(
                statistics?.blocked_companies,
              )}
            />
          </div>
        </section>

        <section className="mt-5 grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="min-h-0 overflow-hidden rounded-card border border-gray-200 bg-surface-1">
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
                className="text-sm font-medium text-primary transition hover:text-primary-hover"
              >
                Ver todos →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px]">
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
                      <td colSpan={3} className="p-0">
                        <TableSkeleton rows={5} columns={["36%", "40%", "18%"]} />
                      </td>
                    </tr>
                  ) : recentUsers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-0">
                        <EmptyState variant="plain" title="No hay usuarios registrados" />
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

          <div className="flex min-h-0 flex-col overflow-hidden rounded-card border border-gray-200 bg-surface-1">
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
                <div className="space-y-3 p-5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-10" />
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <EmptyState variant="plain" title="No hay actividad reciente" />
              ) : currentTime === null ? (
                <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-gray-500">
                  <Spinner size={15} /> Un momento…
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
        <Badge tone={status === "Activo" ? "success" : "danger"}>{status}</Badge>
      </td>
    </tr>
  );
}

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
    success: "bg-success-bg text-success",
    info: "bg-info-bg text-info",
    danger: "bg-danger-bg text-danger",
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

function formatRelativeTime(
  dateString: string,
  currentTime: number,
): string {
  let normalizedDate = dateString;

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
