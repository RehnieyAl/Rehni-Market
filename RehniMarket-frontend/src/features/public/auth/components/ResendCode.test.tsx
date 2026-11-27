// Reenvío de códigos: contador que dicta el backend, 429 con retry_after, un solo envío por clic,
// correo conservado entre recargas y reenvío del código de recuperación sin repetir la solicitud.
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { render } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";

import ResendCode from "./ResendCode";
import ResetPassword from "../pages/ResetPassword";
import VerifyEmail from "../pages/VerifyEmail";
import ForgotPassword from "../pages/ForgotPassword";
import { renderWithProviders } from "@/test/renderApp";
import { apiError } from "@/test/http";

afterEach(() => {
  vi.useRealTimers();
  sessionStorage.clear();
});

function axiosLike(status: number, detail: object, headers: Record<string, string> = {}) {
  return Object.assign(new Error("http"), { isAxiosError: true, response: { status, data: { detail }, headers } });
}

describe("ResendCode", () => {
  it("bloquea el botón durante el cooldown del servidor y lo habilita al terminar", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    const onResend = vi.fn();
    render(<ResendCode email="ana@rehni.test" availableIn={3} onResend={onResend} />);

    const button = screen.getByRole("button", { name: /Reenviar código/ }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(screen.getByText("00:03")).toBeTruthy();
    expect(button.getAttribute("aria-describedby")).toBe("resend-countdown");

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(button.disabled).toBe(false);
    expect(screen.queryByText(/Podrás reenviarlo/)).toBeNull();
  });

  it("un doble clic envía una sola solicitud y confirma el reenvío", async () => {
    let resolve!: (value: { expires_in: number; resend_available_in: number }) => void;
    const onResend = vi.fn(() => new Promise<{ expires_in: number; resend_available_in: number }>((r) => (resolve = r)));
    const onResent = vi.fn();
    render(<ResendCode email="ana@rehni.test" onResend={onResend} onResent={onResent} />);

    const button = screen.getByRole("button", { name: /Reenviar código/ });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onResend).toHaveBeenCalledTimes(1);
    expect(button.getAttribute("aria-busy")).toBe("true");

    await act(async () => resolve({ expires_in: 300, resend_available_in: 60 }));
    expect(screen.getByRole("status").textContent).toBe("Código reenviado. Revisa tu correo.");
    expect(onResent).toHaveBeenCalledWith({ expires_in: 300, resend_available_in: 60 });
    expect(screen.getByText("01:00")).toBeTruthy();
  });

  it("un 429 muestra el error real y reprograma con Retry-After si no viene en el cuerpo", async () => {
    const onResend = vi.fn().mockRejectedValue(
      axiosLike(429, { code: "CODE_SEND_LIMIT_EXCEEDED", message: "Solicitaste demasiados códigos." }, { "retry-after": "120" }),
    );
    render(<ResendCode email="ana@rehni.test" onResend={onResend} />);

    fireEvent.click(screen.getByRole("button", { name: /Reenviar código/ }));

    expect((await screen.findByRole("alert")).textContent).toBe("Solicitaste demasiados códigos.");
    expect(screen.getByText("02:00")).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("un error de red no muestra una confirmación falsa", async () => {
    render(<ResendCode email="ana@rehni.test" onResend={vi.fn().mockRejectedValue(new Error("offline"))} />);

    fireEvent.click(screen.getByRole("button", { name: /Reenviar código/ }));

    expect((await screen.findByRole("alert")).textContent).toContain("No fue posible reenviar el código");
    expect((screen.getByRole("button", { name: /Reenviar código/ }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("sin correo no permite reenviar", () => {
    render(<ResendCode email="" onResend={vi.fn()} />);
    expect((screen.getByRole("button", { name: /Reenviar código/ }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("Flujos con reenvío", () => {
  function resetRoutes() {
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/login" element={<p>PÁGINA LOGIN</p>} />
      </Routes>
    );
  }

  it("olvidé mi contraseña pasa el cooldown del servidor a la pantalla de restablecer", async () => {
    renderWithProviders(resetRoutes(), {
      path: "/forgot-password",
      routes: { "POST /auth/forgot-password-user": { message: "ok", expires_in: 900, resend_available_in: 60 } },
    });
    fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { value: "ana@rehni.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));

    expect(await screen.findByRole("heading", { name: "Nueva contraseña" })).toBeTruthy();
    expect(screen.getByText("01:00")).toBeTruthy();
    expect((screen.getByRole("button", { name: /Reenviar código/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("reenvía el código de recuperación al mismo correo, limpia el código y acepta el nuevo", async () => {
    const { http } = renderWithProviders(resetRoutes(), {
      path: { pathname: "/reset-password", state: { email: "ana@rehni.test", resendAvailableIn: 0 } },
      routes: {
        "POST /auth/forgot-password-user": { message: "ok", expires_in: 900, resend_available_in: 60 },
        "POST /auth/reset-password-user": { message: "ok" },
      },
    });
    const inputs = screen.getAllByRole("textbox").slice(0, 6);
    "111111".split("").forEach((d, i) => fireEvent.change(inputs[i], { target: { value: d } }));

    fireEvent.click(screen.getByRole("button", { name: /Reenviar código/ }));
    expect(await screen.findByText("Código reenviado. Revisa tu correo.")).toBeTruthy();
    expect(http.calls("POST /auth/forgot-password-user")[0].body).toEqual({ email: "ana@rehni.test" });
    expect((inputs[0] as HTMLInputElement).value).toBe("");

    "222222".split("").forEach((d, i) => fireEvent.change(inputs[i], { target: { value: d } }));
    fireEvent.change(screen.getByLabelText(/^Nueva contraseña/), { target: { value: "Secreta1!" } });
    fireEvent.change(screen.getByLabelText(/^Confirmar contraseña/), { target: { value: "Secreta1!" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar nueva contraseña" }));
    expect(await screen.findByText("PÁGINA LOGIN")).toBeTruthy();
    expect(http.calls("POST /auth/reset-password-user")[0].body).toMatchObject({ code: "222222" });
  });

  it("demasiados intentos con el código limpia el campo y lo informa", async () => {
    renderWithProviders(resetRoutes(), {
      path: { pathname: "/reset-password", state: { email: "ana@rehni.test" } },
      routes: {
        "POST /auth/reset-password-user": apiError(429, "CODE_ATTEMPTS_EXCEEDED", "Superaste el número de intentos con este código."),
      },
    });
    const inputs = screen.getAllByRole("textbox").slice(0, 6) as HTMLInputElement[];
    "333333".split("").forEach((d, i) => fireEvent.change(inputs[i], { target: { value: d } }));
    fireEvent.change(screen.getByLabelText(/^Nueva contraseña/), { target: { value: "Secreta1!" } });
    fireEvent.change(screen.getByLabelText(/^Confirmar contraseña/), { target: { value: "Secreta1!" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar nueva contraseña" }));

    expect((await screen.findAllByText("Superaste el número de intentos con este código.")).length).toBeGreaterThan(0);
    await waitFor(() => expect(inputs.map((input) => input.value).join("")).toBe(""));
  });

  it("al recargar la verificación se conserva el correo del registro", () => {
    renderWithProviders(<VerifyEmail />, { path: { pathname: "/verify-email", state: { email: "tienda@rehni.test" } } });
    expect(sessionStorage.getItem("verifyEmail.email")).toBe("tienda@rehni.test");
  });

  it("sin estado de navegación usa el correo guardado en la sesión", () => {
    sessionStorage.setItem("resetPassword.email", "ana@rehni.test");
    renderWithProviders(<ResetPassword />, { path: "/reset-password" });
    expect(screen.getAllByText("ana@rehni.test").length).toBeGreaterThan(0);
    expect((screen.getByRole("button", { name: /Reenviar código/ }) as HTMLButtonElement).disabled).toBe(false);
  });
});
