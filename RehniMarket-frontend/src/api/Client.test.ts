// Cliente HTTP: token Bearer, renovación ante 401, cuentas bloqueadas y alertas globales.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "./Client";
import { handleApiError } from "./apiErrorHandler";
import { consumePostLoginRedirect, SESSION_EXPIRED_EVENT, setPostLoginRedirect } from "./session";
import { registerAlertListener } from "@/shared/components/alert/alertManager";
import { apiError, mockApi, reply } from "@/test/http";

const alerts: Array<[string, string]> = [];
const expired: string[] = [];
let unregister: () => void;
const onExpired = (event: Event) => expired.push((event as CustomEvent<{ message: string }>).detail.message);

beforeEach(() => {
  alerts.length = 0;
  expired.length = 0;
  unregister = registerAlertListener((type, message) => alerts.push([type, message]));
  window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  unregister();
  window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  vi.restoreAllMocks();
});

describe("api · petición", () => {
  it("adjunta el token de acceso como Bearer si existe", async () => {
    const http = mockApi({ "GET /ping": { ok: true } });
    await api.get("/ping");
    expect(http.requests[0].headers.Authorization).toBeUndefined();

    localStorage.setItem("accessToken", "tok-1");
    await api.get("/ping");
    expect(http.requests[1].headers.Authorization).toBe("Bearer tok-1");
  });
});

describe("api · renovación de sesión", () => {
  it("ante un 401 renueva los tokens y repite la petición original", async () => {
    localStorage.setItem("accessToken", "viejo");
    localStorage.setItem("refreshToken", "refresh-1");
    let first = true;
    const http = mockApi({
      "GET /orders": () => {
        if (first) {
          first = false;
          return reply(401, { detail: { code: "TOKEN_EXPIRED", message: "Expirado" } });
        }
        return [{ id: "o1" }];
      },
      "POST /auth/refresh": { access_token: "nuevo", refresh_token: "refresh-2" },
    });

    const { data } = await api.get("/orders");

    expect(data).toEqual([{ id: "o1" }]);
    expect(http.calls("POST /auth/refresh")[0].body).toEqual({ refresh_token: "refresh-1" });
    expect(localStorage.getItem("accessToken")).toBe("nuevo");
    expect(localStorage.getItem("refreshToken")).toBe("refresh-2");
    expect(http.calls("GET /orders")[1].headers.Authorization).toBe("Bearer nuevo");
  });

  it("sin refresh token cierra la sesión y avisa una vez, sin recargar ni navegar", async () => {
    localStorage.setItem("accessToken", "viejo");
    window.history.pushState({}, "", "/products/p1?variant=blue");
    mockApi({ "GET /orders": reply(401, {}) });

    await expect(api.get("/orders")).rejects.toBeTruthy();
    await expect(api.get("/orders")).rejects.toBeTruthy();

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(expired).toEqual(["Tu sesión ha expirado. Inicia sesión nuevamente."]);
    expect(window.location.pathname + window.location.search).toBe("/products/p1?variant=blue");
  });

  it("un visitante sin sesión que recibe 401 no dispara el cierre de sesión", async () => {
    mockApi({ "GET /orders": reply(401, {}) });

    await expect(api.get("/orders")).rejects.toBeTruthy();
    expect(expired).toEqual([]);
  });

  it("si el refresh responde cuenta bloqueada, cierra la sesión con ese motivo", async () => {
    localStorage.setItem("accessToken", "viejo");
    localStorage.setItem("refreshToken", "r");
    mockApi({
      "GET /orders": reply(401, {}),
      "POST /auth/refresh": apiError(403, "USER_BLOCKED", "Tu cuenta fue bloqueada por un administrador."),
    });

    await expect(api.get("/orders")).rejects.toBeTruthy();

    expect(expired).toEqual(["Tu cuenta fue bloqueada por un administrador."]);
    expect(localStorage.getItem("refreshToken")).toBeNull();
  });

  it("si el refresh falla por otro motivo cierra la sesión por expiración", async () => {
    localStorage.setItem("accessToken", "viejo");
    localStorage.setItem("refreshToken", "r");
    mockApi({ "GET /orders": reply(401, {}), "POST /auth/refresh": reply(500, {}) });

    await expect(api.get("/orders")).rejects.toBeTruthy();
    expect(expired).toEqual(["Tu sesión ha expirado. Inicia sesión nuevamente."]);
  });

  it("los errores distintos de 401 llegan a la alerta global con el mensaje del backend", async () => {
    mockApi({ "POST /cart/add": apiError(400, "INSUFFICIENT_STOCK", "No hay stock suficiente.") });

    await expect(api.post("/cart/add", {})).rejects.toBeTruthy();
    expect(alerts).toContainEqual(["error", "No hay stock suficiente."]);
  });
});

describe("handleApiError", () => {
  function axiosLike(status: number, detail?: unknown) {
    return Object.assign(new Error("x"), {
      isAxiosError: true,
      response: { status, data: detail === undefined ? {} : { detail } },
    });
  }

  it("un error que no es de axios muestra el mensaje inesperado", () => {
    handleApiError(new Error("boom"));
    expect(alerts).toEqual([["error", "Ocurrió un error inesperado."]]);
  });

  it("sin mensaje usa el texto genérico", () => {
    handleApiError(axiosLike(500));
    expect(alerts).toEqual([["error", "Ocurrió un error al procesar la solicitud."]]);
  });

  it("empresa rechazada o certificado inválido no generan alerta (los atiende el login)", () => {
    handleApiError(axiosLike(403, { code: "COMPANY_REJECTED", message: "Rechazada" }));
    handleApiError(axiosLike(403, { code: "COMPANY_CERTIFICATE_INVALID", message: "Inválido" }));
    expect(alerts).toEqual([]);
  });

  it("empresa suspendida con sesión: cierra sesión e incluye la razón", () => {
    localStorage.setItem("accessToken", "t");
    handleApiError(
      axiosLike(403, { code: "COMPANY_SUSPENDED", message: "Empresa suspendida.", reason: "  Fraude  " }),
    );
    expect(expired).toEqual(["Empresa suspendida.\n\nRazón:\nFraude"]);
    expect(localStorage.getItem("accessToken")).toBeNull();
  });

  it("empresa suspendida sin sesión (login): alerta con el mensaje por defecto", () => {
    handleApiError(axiosLike(403, { code: "COMPANY_SUSPENDED" }));
    expect(alerts).toEqual([["error", "Tu empresa se encuentra suspendida."]]);
  });
});

describe("session · redirección posterior al login", () => {
  it("guarda la ruta, ignora /login y se consume una sola vez", () => {
    setPostLoginRedirect("/login");
    expect(consumePostLoginRedirect()).toBeNull();
    setPostLoginRedirect("/checkout");
    expect(consumePostLoginRedirect()).toBe("/checkout");
    expect(consumePostLoginRedirect()).toBeNull();
  });
});
