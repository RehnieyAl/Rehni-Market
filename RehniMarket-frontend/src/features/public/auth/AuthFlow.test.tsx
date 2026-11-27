// Flujo de sesión sobre la app completa: login en modal sin salir de la página (fondo desenfocado,
// foco, Escape), cierre de sesión que conserva la página pública, rutas privadas, sesión expirada y
// redirecciones seguras.
import { afterEach, describe, expect, it } from "vitest";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";

import { SESSION_EXPIRED_EVENT, setPostLoginRedirect } from "@/api/session";
import { profileFor, renderApp } from "@/test/renderApp";
import { apiError } from "@/test/http";

import { isPublicReturnPath, isSafeInternalPath, lastPublicPath, rememberPublicPath } from "./authNavigation";

const TOKENS = { access_token: "access-user", refresh_token: "refresh-user", role: "user" };

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

const here = () => window.location.pathname + window.location.search + window.location.hash;

function openLoginFromNavbar() {
  const trigger = screen.getAllByRole("link", { name: "Iniciar sesión" })[0];
  trigger.focus();
  fireEvent.click(trigger);
  return trigger;
}

async function loginInModal(dialog: HTMLElement) {
  fireEvent.change(within(dialog).getByLabelText(/^Correo electrónico/), { target: { value: "user@rehni.test", name: "email" } });
  fireEvent.change(within(dialog).getByLabelText(/^Contraseña/), { target: { value: "Secreto123", name: "password" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Iniciar sesión" }));
}

async function signOutFromNavbar() {
  fireEvent.click((await screen.findAllByRole("button", { name: /Cuenta user/ }))[0]);
  fireEvent.click(await screen.findByRole("button", { name: "Cerrar sesión" }));
}

describe("Login en modal", () => {
  it("se abre desde el navbar sobre la página actual con el fondo desenfocado y el formulario nítido", async () => {
    renderApp("/offers?discount=true#lista");
    const trigger = openLoginFromNavbar();

    const dialog = await screen.findByRole("dialog", { name: "Iniciar sesión" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    const overlay = dialog.parentElement as HTMLElement;
    expect(overlay.dataset.backdrop).toBe("blur");
    expect(overlay.className).toContain("backdrop-blur-sm");
    expect(overlay.className).toContain("bg-black/60");
    expect(dialog.className).not.toContain("blur");
    expect(here()).toBe("/offers?discount=true#lista");
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.activeElement).toBe(within(dialog).getByLabelText(/^Correo electrónico/));
    expect(within(dialog).queryByRole("img", { name: /RehniMarket/ })).toBeNull();
    expect(within(dialog).getByRole("link", { name: /Olvidaste tu contraseña/ })).toBeTruthy();
    expect(within(dialog).getByRole("link", { name: "Crear cuenta" })).toBeTruthy();

    fireEvent.click(within(dialog).getByRole("button", { name: "Cerrar" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Iniciar sesión" })).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it("Escape lo cierra y mostrar/ocultar la contraseña funciona", async () => {
    renderApp("/");
    openLoginFromNavbar();
    const dialog = await screen.findByRole("dialog", { name: "Iniciar sesión" });
    const password = within(dialog).getByLabelText(/^Contraseña/) as HTMLInputElement;
    fireEvent.click(within(dialog).getByRole("button", { name: "Mostrar contraseña" }));
    expect(password.type).toBe("text");

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Iniciar sesión" })).toBeNull());
  });

  it("al iniciar sesión cierra el modal y deja al usuario en la misma página con su sesión", async () => {
    const { http } = renderApp("/products?search=silla", {
      routes: { "POST /auth/login-user": TOKENS, "GET /auth/me": profileFor("user") },
    });
    openLoginFromNavbar();
    await loginInModal(await screen.findByRole("dialog", { name: "Iniciar sesión" }));

    expect(await screen.findAllByRole("button", { name: /Cuenta user/ })).toBeTruthy();
    expect(screen.queryByRole("dialog", { name: "Iniciar sesión" })).toBeNull();
    expect(here()).toBe("/products?search=silla");
    expect(http.calls("POST /auth/login-user")[0].body).toEqual({ email: "user@rehni.test", password: "Secreto123" });
    expect(localStorage.getItem("accessToken")).toBe("access-user");
  });

  it("credenciales incorrectas: el modal sigue abierto, muestra el error y no hay sesión", async () => {
    renderApp("/products?search=silla", {
      routes: { "POST /auth/login-user": apiError(401, "INVALID_CREDENTIALS", "Correo o contraseña incorrectos.") },
    });
    openLoginFromNavbar();
    const dialog = await screen.findByRole("dialog", { name: "Iniciar sesión" });
    await loginInModal(dialog);

    expect(await screen.findByText("Correo o contraseña incorrectos.")).toBeTruthy();
    expect(screen.getByRole("dialog", { name: "Iniciar sesión" })).toBeTruthy();
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(here()).toBe("/products?search=silla");
  });

  it("ir a recuperar la contraseña cierra el modal y la flecha regresa a la página de origen", async () => {
    renderApp("/offers");
    openLoginFromNavbar();
    const dialog = await screen.findByRole("dialog", { name: "Iniciar sesión" });
    fireEvent.click(within(dialog).getByRole("link", { name: /Olvidaste tu contraseña/ }));

    expect(await screen.findByRole("heading", { name: "¿Olvidaste tu contraseña?" })).toBeTruthy();
    expect(screen.queryByRole("dialog", { name: "Iniciar sesión" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Regresar" }));
    await waitFor(() => expect(window.location.pathname).toBe("/offers"));
  });
});

describe("Cierre de sesión", () => {
  it("en una página pública conserva ruta, búsqueda y hash y muestra la vista de visitante sin datos privados", async () => {
    renderApp("/products?search=silla&page=2#resultados", {
      role: "user",
      routes: { "GET /cart": { id: "c", items: [], subtotal: "0", tax: "0", total: "0", totalItems: 3 } },
    });
    expect(await screen.findByText("3")).toBeTruthy();

    await signOutFromNavbar();

    expect(await screen.findAllByRole("link", { name: "Iniciar sesión" })).toBeTruthy();
    expect(here()).toBe("/products?search=silla&page=2#resultados");
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(screen.queryByRole("button", { name: "Mi carrito" })).toBeNull();
    expect(screen.queryByText("3")).toBeNull();
  });

  it("en el perfil público de una empresa se queda en la tienda", async () => {
    renderApp("/company/e1", { role: "user" });
    await signOutFromNavbar();

    expect(await screen.findAllByRole("link", { name: "Iniciar sesión" })).toBeTruthy();
    expect(window.location.pathname).toBe("/company/e1");
  });

  it("en una ruta privada limpia la sesión y vuelve a la última página pública", async () => {
    sessionStorage.setItem("lastPublicPath", "/products/p1?variant=blue");
    renderApp("/user/dashboard?tab=orders", { role: "user" });
    fireEvent.click((await screen.findAllByRole("button", { name: "Cerrar sesión" }))[0]);

    await waitFor(() => expect(here()).toBe("/products/p1?variant=blue"));
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(screen.queryByText("Panel Comprador")).toBeNull();
  });

  it("en una ruta privada sin página pública conocida usa el inicio como respaldo", async () => {
    renderApp("/company/dashboard", { role: "company" });
    fireEvent.click((await screen.findAllByRole("button", { name: "Cerrar sesión" }))[0]);

    await waitFor(() => expect(window.location.pathname).toBe("/"));
  });
});

describe("Sesión expirada", () => {
  it("en una página pública el usuario sigue en ella como visitante, con aviso y sin recargar", async () => {
    renderApp("/products?search=silla", { role: "user" });
    await screen.findAllByRole("button", { name: /Cuenta user/ });

    act(() => {
      localStorage.clear();
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { message: "Tu sesión ha expirado." } }));
    });

    expect(await screen.findByText("Tu sesión ha expirado.")).toBeTruthy();
    expect(await screen.findAllByRole("link", { name: "Iniciar sesión" })).toBeTruthy();
    expect(here()).toBe("/products?search=silla");
  });

  it("en una ruta privada lleva al login recordando el destino", async () => {
    renderApp("/user/dashboard?tab=orders", { role: "user" });
    await screen.findByText("Panel Comprador");

    act(() => {
      localStorage.clear();
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { message: "Tu sesión ha expirado." } }));
    });

    await waitFor(() => expect(window.location.pathname).toBe("/login"));
    expect(sessionStorage.getItem("postLoginRedirect")).toBe("/user/dashboard?tab=orders");
    expect(screen.queryByText("Panel Comprador")).toBeNull();
  });
});

describe("Página /login (acceso directo)", () => {
  it("muestra el mismo formulario en una tarjeta con flecha de regreso", async () => {
    renderApp("/login");
    expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Regresar" })).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("ignora un destino externo malicioso y vuelve a la última página pública", async () => {
    sessionStorage.setItem("lastPublicPath", "/offers");
    renderApp("/login", { routes: { "POST /auth/login-user": TOKENS, "GET /auth/me": profileFor("user") } });
    setPostLoginRedirect("//evil.example.com/robar");
    fireEvent.change(await screen.findByLabelText(/^Correo electrónico/), { target: { value: "user@rehni.test", name: "email" } });
    fireEvent.change(screen.getByLabelText(/^Contraseña/), { target: { value: "Secreto123", name: "password" } });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => expect(window.location.pathname).toBe("/offers"));
  });

  it("tras pedir una ruta protegida vuelve a ella si el rol la permite", async () => {
    renderApp("/checkout", { routes: { "POST /auth/login-user": TOKENS, "GET /auth/me": profileFor("user") } });
    await waitFor(() => expect(window.location.pathname).toBe("/login"));
    fireEvent.change(await screen.findByLabelText(/^Correo electrónico/), { target: { value: "user@rehni.test", name: "email" } });
    fireEvent.change(screen.getByLabelText(/^Contraseña/), { target: { value: "Secreto123", name: "password" } });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => expect(window.location.pathname).toBe("/checkout"));
  });
});

describe("Flecha Regresar", () => {
  it.each([
    ["/forgot-password", "/login"],
    ["/reset-password", "/forgot-password"],
    ["/verify-email", "/login"],
  ])("en %s abierto directamente va a %s", async (start, fallback) => {
    renderApp(start);
    fireEvent.click(await screen.findByRole("button", { name: "Regresar" }));
    await waitFor(() => expect(window.location.pathname).toBe(fallback));
  });

  it("el registro abierto directamente vuelve a la última página pública", async () => {
    sessionStorage.setItem("lastPublicPath", "/categories?catalog=2");
    renderApp("/register-user");
    fireEvent.click(await screen.findByRole("button", { name: "Regresar" }));
    await waitFor(() => expect(here()).toBe("/categories?catalog=2"));
  });
});

describe("Rutas de retorno", () => {
  it.each([
    ["/products/1?variant=blue#fotos", true],
    ["//evil.example.com", false],
    ["/\\evil.example.com", false],
    ["https://evil.example.com", false],
    ["javascript:alert(1)", false],
    ["/products\n/x", false],
    [null, false],
  ])("isSafeInternalPath(%j) = %s", (path, expected) => {
    expect(isSafeInternalPath(path)).toBe(expected);
  });

  it("solo recuerda páginas públicas fuera del flujo de acceso", () => {
    rememberPublicPath("/categories?catalog=3");
    rememberPublicPath("/login");
    rememberPublicPath("/admin/dashboard");
    rememberPublicPath("/reset-password");
    expect(lastPublicPath()).toBe("/categories?catalog=3");
    expect(isPublicReturnPath("/checkout")).toBe(false);

    sessionStorage.setItem("lastPublicPath", "//evil.example.com");
    expect(lastPublicPath()).toBe("/");
  });
});
