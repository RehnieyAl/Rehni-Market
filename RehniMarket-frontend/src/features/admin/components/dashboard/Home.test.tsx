// Inicio del panel admin: estadísticas, usuarios recientes, actividad y navegación por pestañas.
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";

import { renderApp } from "@/test/renderApp";
import { reply } from "@/test/http";

const NOW = new Date("2026-11-24T12:00:00Z").getTime();

function ago(ms: number) {
  return new Date(NOW - ms).toISOString().replace("Z", "");
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const STATS = {
  users: 40,
  active_users: 35,
  blocked_users: 5,
  administrators: 2,
  companies: 12,
  active_companies: 10,
  blocked_companies: 2,
};

const ACTIVITIES = [
  { id: "a1", title: "Empresa aprobada", description: "ACME", action: "company_approved", created_at: ago(10_000) },
  { id: "a2", title: "Usuario bloqueado", description: "Ana", action: "user_blocked", created_at: ago(1 * MIN) },
  { id: "a3", title: "Usuario editado", description: "Luis", action: "user_updated", created_at: ago(5 * MIN) },
  { id: "a4", title: "Alta", description: "Eva", action: "user_created", created_at: ago(1 * HOUR) },
  { id: "a5", title: "Hora y minuto", description: "-", action: "user_created", created_at: ago(2 * HOUR + 1 * MIN) },
  { id: "a6", title: "Un día", description: "-", action: "user_created", created_at: ago(1 * DAY) },
  { id: "a7", title: "Días y hora", description: "-", action: "user_created", created_at: ago(3 * DAY + 1 * HOUR) },
  { id: "a8", title: "Un mes", description: "-", action: "user_created", created_at: ago(30 * DAY) },
  { id: "a9", title: "Meses y día", description: "-", action: "user_created", created_at: ago(61 * DAY) },
  { id: "a10", title: "Mala fecha", description: "-", action: "user_created", created_at: "no-es-fecha" },
];

const RECENT_USERS = [
  { id: "u1", fullName: "Ana Gómez", email: "ana@rehni.test", role: "user", isActive: true },
  { id: "u2", fullName: "Tienda Uno", email: "t1@rehni.test", role: "company", isActive: false },
  { id: "u3", fullName: "Admin Dos", email: "ad@rehni.test", role: "admin", isActive: true },
  { id: "u4", fullName: "Raro", email: "r@rehni.test", role: "auditor", isActive: true },
];

afterEach(() => {
  vi.useRealTimers();
});

describe("Admin · Inicio", () => {
  it("muestra estadísticas, usuarios recientes y la actividad con tiempos relativos", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: NOW });
    renderApp("/admin/dashboard", {
      role: "admin",
      routes: {
        "GET /admin/dashboard/statistics": STATS,
        "GET /admin/dashboard/recent-activities": ACTIVITIES,
        "GET /admin/dashboard/recent-users": RECENT_USERS,
      },
    });

    expect(await screen.findByText("Panel Administrador")).toBeTruthy();
    expect(await screen.findByText("40")).toBeTruthy();
    expect(screen.getByText("35")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();

    expect(await screen.findByText("Ana Gómez")).toBeTruthy();
    expect(screen.getByText("Empresa")).toBeTruthy();
    expect(screen.getAllByText("Administrador").length).toBeGreaterThan(1);
    expect(screen.getByText("auditor")).toBeTruthy();
    expect(screen.getAllByText("Bloqueado").length).toBeGreaterThan(0);

    expect(await screen.findByText("Hace unos segundos")).toBeTruthy();
    expect(screen.getByText("Hace 1 minuto")).toBeTruthy();
    expect(screen.getByText("Hace 5 minutos")).toBeTruthy();
    expect(screen.getByText("Hace 1 hora")).toBeTruthy();
    expect(screen.getByText("Hace 2 horas y 1 minuto")).toBeTruthy();
    expect(screen.getByText("Hace 1 día")).toBeTruthy();
    expect(screen.getByText("Hace 3 días y 1 hora")).toBeTruthy();
    expect(screen.getByText("Hace 1 mes")).toBeTruthy();
    expect(screen.getByText("Hace 2 meses y 1 día")).toBeTruthy();
    expect(screen.getByText("Fecha inválida")).toBeTruthy();
  });

  it("si fallan las estadísticas muestra guiones y una alerta de error", async () => {
    renderApp("/admin/dashboard", {
      role: "admin",
      routes: {
        "GET /admin/dashboard/statistics": reply(500, {}),
        "GET /admin/dashboard/recent-activities": [],
        "GET /admin/dashboard/recent-users": [],
      },
    });

    await waitFor(() => expect(screen.getAllByText("—").length).toBe(7));
    expect(screen.getByText("No hay usuarios registrados")).toBeTruthy();
    expect(screen.getByText("No hay actividad reciente")).toBeTruthy();
    const alerts = await screen.findAllByRole("alert");
    expect(alerts.some((a) => a.textContent?.includes("No se pudieron cargar las estadísticas."))).toBe(true);
  });

  it("'Ver todos' navega a la pestaña de usuarios", async () => {
    const { http } = renderApp("/admin/dashboard", {
      role: "admin",
      routes: {
        "GET /admin/dashboard/statistics": STATS,
        "GET /admin/dashboard/recent-activities": [],
        "GET /admin/dashboard/recent-users": [],
        "GET /admin/dashboard/get-users": { items: [], next_cursor: null, previous_cursor: null, has_next: false, has_previous: false },
      },
    });

    fireEvent.click(await screen.findByRole("button", { name: /Ver todos/ }));
    await waitFor(() => expect(window.location.search).toBe("?tab=users"));
    await waitFor(() => expect(http.calls("GET /admin/dashboard/get-users").length).toBeGreaterThan(0));
  });

  it("el propietario ve Liquidaciones; un admin que pide esa pestaña vuelve a Inicio", async () => {
    renderApp("/admin/dashboard?tab=payouts", {
      role: "admin",
      routes: {
        "GET /admin/dashboard/statistics": STATS,
        "GET /admin/dashboard/recent-activities": [],
        "GET /admin/dashboard/recent-users": [],
      },
    });
    expect(await screen.findByText("Resumen general de RehniMarket.")).toBeTruthy();
    const nav = screen.getAllByRole("navigation")[0];
    expect(within(nav).queryByText("Liquidaciones")).toBeNull();
  });

  it("contraer el menú lateral se recuerda en localStorage", async () => {
    renderApp("/admin/dashboard", {
      role: "owner",
      routes: {
        "GET /admin/dashboard/statistics": STATS,
        "GET /admin/dashboard/recent-activities": [],
        "GET /admin/dashboard/recent-users": [],
      },
    });
    expect(await screen.findByText("Panel Propietario")).toBeTruthy();
    expect(screen.getByText("Liquidaciones")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Contraer menú" }));
    expect(localStorage.getItem("rm_dashboard_rail")).toBe("1");
    fireEvent.click(screen.getByRole("button", { name: "Expandir menú" }));
    expect(localStorage.getItem("rm_dashboard_rail")).toBe("0");
  });
});
