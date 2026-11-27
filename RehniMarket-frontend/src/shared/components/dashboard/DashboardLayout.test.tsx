// Navegación responsive del panel: cajón móvil (abrir, navegar, Escape, clic fuera) y aviso móvil.
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";

import MobileAppNotice from "@/shared/components/MobileAppNotice";
import { renderApp, renderWithProviders } from "@/test/renderApp";

const ROUTES = {
  "GET /orders": { items: [], total: 0, page: 1, limit: 20, total_pages: 1 },
  "GET /wallet/me": { balance: "0" },
  "GET /public/products/daily": [],
  "GET /favorites": [],
};

describe("Panel · menú móvil", () => {
  it("abre el cajón, navega a una pestaña y se cierra", async () => {
    renderApp("/user/dashboard", { role: "user", routes: ROUTES });
    fireEvent.click(await screen.findByRole("button", { name: /Abrir menú/ }));
    const drawer = await screen.findByRole("dialog", { name: "Menú de navegación" });
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.click(within(drawer).getByRole("button", { name: "Favoritos" }));
    await waitFor(() => expect(window.location.search).toBe("?tab=favorites"));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Menú de navegación" })).toBeNull());
  });

  it("Escape y el botón de cerrar ocultan el cajón", async () => {
    renderApp("/user/dashboard", { role: "user", routes: ROUTES });
    fireEvent.click(await screen.findByRole("button", { name: /Abrir menú/ }));
    await screen.findByRole("dialog", { name: "Menú de navegación" });
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Menú de navegación" })).toBeNull());

    fireEvent.click(screen.getByRole("button", { name: /Abrir menú/ }));
    const drawer = await screen.findByRole("dialog", { name: "Menú de navegación" });
    fireEvent.click(within(drawer).getByRole("button", { name: "Cerrar menú" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Menú de navegación" })).toBeNull());
  });

  it("cerrar sesión desde el menú lateral limpia la sesión", async () => {
    renderApp("/user/dashboard", { role: "user", routes: ROUTES });
    await screen.findByText("Panel Comprador");
    const [logout] = screen.getAllByRole("button", { name: "Cerrar sesión" });
    fireEvent.click(logout);
    expect(localStorage.getItem("accessToken")).toBeNull();
  });
});

describe("Aviso de app móvil", () => {
  it("se muestra la primera vez y se recuerda al cerrarlo", () => {
    renderWithProviders(<MobileAppNotice />);
    expect(screen.getByText(/Estás usando RehniMarket en el navegador/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar aviso" }));
    expect(screen.queryByText(/Estás usando RehniMarket en el navegador/)).toBeNull();
    expect(localStorage.getItem("rm_mobile_notice_dismissed")).toBe("1");
  });

  it("si el almacenamiento falla igual se oculta en la sesión", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("cuota");
    });
    renderWithProviders(<MobileAppNotice />);
    fireEvent.click(screen.getByRole("button", { name: "Cerrar aviso" }));
    expect(screen.queryByText(/Estás usando RehniMarket en el navegador/)).toBeNull();
    spy.mockRestore();
  });
});
