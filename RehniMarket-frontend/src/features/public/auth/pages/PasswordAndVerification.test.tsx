// Verificación de correo (OTP con vencimiento y reenvío), recuperación y restablecimiento de
// contraseña, y configuración de cuenta (perfil, foto, correo, contraseña).
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";

import VerifyEmail from "./VerifyEmail";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import { profileFor, renderApp, renderWithProviders } from "@/test/renderApp";
import { apiError, formDataToObject, makeFile, reply } from "@/test/http";

function authRoutes(element: React.ReactElement, path: string) {
  return (
    <Routes>
      <Route path={path} element={element} />
      <Route path="/login" element={<p>PÁGINA LOGIN</p>} />
      <Route path="/verify-email" element={<p>PÁGINA VERIFICAR</p>} />
      <Route path="/reset-password" element={<p>PÁGINA RESTABLECER</p>} />
    </Routes>
  );
}

function typeCode(code: string, group = "Código de verificación") {
  const inputs = within(screen.getByRole("group", { name: group })).getAllByRole("textbox");
  code.split("").forEach((digit, i) => fireEvent.change(inputs[i], { target: { value: digit } }));
  return inputs;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("Verificar correo", () => {
  function renderVerify(state: object, routes: Record<string, unknown> = {}) {
    return renderWithProviders(authRoutes(<VerifyEmail />, "/verify-email"), {
      path: { pathname: "/verify-email", state },
      routes,
    });
  }

  it("verifica con el código completo y lleva al login", async () => {
    const { http } = renderVerify(
      { email: "ana@rehni.test", expiresIn: 300, resendAvailableIn: 60 },
      { "POST /auth/verify-email-user": { verified: true, message: "ok" } },
    );
    expect(screen.getByText("ana@rehni.test")).toBeTruthy();
    expect(screen.getByText("05:00")).toBeTruthy();
    expect(screen.getByText("01:00")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Verificar correo" }));
    expect(await screen.findByText("Ingresa el código completo.")).toBeTruthy();

    typeCode("123456");
    fireEvent.click(screen.getByRole("button", { name: "Verificar correo" }));
    expect(await screen.findByText("PÁGINA LOGIN")).toBeTruthy();
    expect(http.calls("POST /auth/verify-email-user")[0].body).toEqual({ email: "ana@rehni.test", code: "123456" });
  });

  it("código vencido por el backend bloquea el formulario", async () => {
    renderVerify(
      { email: "ana@rehni.test", expiresIn: 300, resendAvailableIn: 0 },
      { "POST /auth/verify-email-user": apiError(400, "CODE_EXPIRED", "El código expiró.") },
    );
    typeCode("123456");
    fireEvent.click(screen.getByRole("button", { name: "Verificar correo" }));
    expect(await screen.findByText("El código expiró")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Verificar correo" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("el reenvío respeta el enfriamiento y renueva el código", async () => {
    const { http } = renderVerify(
      { email: "ana@rehni.test", expiresIn: 0, resendAvailableIn: 0 },
      {
        "POST /auth/resend-verification-code": { expires_in: 300, resend_available_in: 60, message: "Código reenviado." },
      },
    );
    expect(screen.getByText("El código expiró")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Reenviar código/ }));
    expect(await screen.findByText("Código reenviado. Revisa tu correo.")).toBeTruthy();
    expect(http.calls("POST /auth/resend-verification-code")[0].body).toEqual({ email: "ana@rehni.test" });
    expect(await screen.findByText(/Podrás reenviarlo en/)).toBeTruthy();
  });

  it("enfriamiento activo informado por el backend reprograma el reenvío", async () => {
    renderVerify(
      { email: "ana@rehni.test", expiresIn: 300, resendAvailableIn: 0 },
      { "POST /auth/resend-verification-code": apiError(429, "RESEND_COOLDOWN_ACTIVE", "Espera.", { retry_after: 42 }) },
    );
    fireEvent.click(screen.getByRole("button", { name: /Reenviar código/ }));
    expect(await screen.findByText("00:42")).toBeTruthy();
  });

  it("el contador avanza con el tiempo hasta vencer", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    renderVerify({ email: "ana@rehni.test", expiresIn: 2, resendAvailableIn: 1 });
    expect(screen.getByText("00:02")).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText("El código expiró")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Verificar correo" }));
  });

  it("cambiar el correo actualiza el destino y reinicia el código; errores informados", async () => {
    let fail = false;
    const { http } = renderVerify(
      { email: "vieja@rehni.test" },
      { "POST /auth/change-email": () => (fail ? reply(500) : { expires_in: 300, resend_available_in: 60 }) },
    );
    fireEvent.click(screen.getByRole("button", { name: /Cambiarlo/ }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Ingresa un correo electrónico.")).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText("Nuevo correo electrónico"), { target: { value: "nueva@rehni.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText(/Correo actualizado correctamente/)).toBeTruthy();
    expect(http.calls("POST /auth/change-email")[0].body).toEqual({ old_email: "vieja@rehni.test", new_email: "nueva@rehni.test" });
    expect(screen.getByText("nueva@rehni.test")).toBeTruthy();

    fail = true;
    fireEvent.click(screen.getByRole("button", { name: /Cambiarlo/ }));
    fireEvent.change(screen.getByPlaceholderText("Nuevo correo electrónico"), { target: { value: "x@rehni.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("No fue posible cambiar el correo.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  });

  it("OTP: pegar el código, navegar con flechas y retroceso; ignora letras", async () => {
    renderVerify({ email: "ana@rehni.test" });
    const inputs = within(screen.getByRole("group", { name: "Código de verificación" })).getAllByRole("textbox") as HTMLInputElement[];
    fireEvent.change(inputs[0], { target: { value: "a" } });
    expect(inputs[0].value).toBe("");
    fireEvent.paste(inputs[0], { clipboardData: { getData: () => "98-76 54" } });
    expect(inputs.map((i) => i.value).join("")).toBe("987654");
    fireEvent.paste(inputs[0], { clipboardData: { getData: () => "abc" } });
    fireEvent.keyDown(inputs[2], { key: "ArrowLeft" });
    fireEvent.keyDown(inputs[2], { key: "ArrowRight" });
    fireEvent.change(inputs[3], { target: { value: "" } });
    fireEvent.keyDown(inputs[3], { key: "Backspace" });
    expect(document.activeElement).toBe(inputs[2]);
  });
});

describe("Olvidé mi contraseña", () => {
  function renderForgot(routes: Record<string, unknown>) {
    renderWithProviders(authRoutes(<ForgotPassword />, "/forgot-password"), { path: "/forgot-password", routes });
    fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { value: "ana@rehni.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
  }

  it("envía el código y pasa a restablecer", async () => {
    renderForgot({ "POST /auth/forgot-password-user": { message: "ok" } });
    expect(await screen.findByText("PÁGINA RESTABLECER")).toBeTruthy();
  });

  it("el enfriamiento o el tope de envíos se informan con el mensaje del backend", async () => {
    renderForgot({
      "POST /auth/forgot-password-user": apiError(429, "RESEND_COOLDOWN_ACTIVE", "Debes esperar antes de solicitar un nuevo código.", { retry_after: 30 }),
    });
    expect(await screen.findByText("Debes esperar antes de solicitar un nuevo código.")).toBeTruthy();
    expect(screen.queryByText("PÁGINA RESTABLECER")).toBeNull();
  });

  it.each([
    ["ACCOUNT_DISABLED", "Tu cuenta está desactivada."],
    ["OTRO", "Algo falló."],
  ])("error %s muestra el mensaje del backend", async (code, message) => {
    renderForgot({ "POST /auth/forgot-password-user": apiError(400, code, message) });
    expect((await screen.findAllByText(message)).length).toBeGreaterThan(0);
  });
});

describe("Restablecer contraseña", () => {
  function renderReset(routes: Record<string, unknown> = {}) {
    return renderWithProviders(authRoutes(<ResetPassword />, "/reset-password"), {
      path: { pathname: "/reset-password", state: { email: "ana@rehni.test" } },
      routes,
    });
  }

  function fillPasswords(a: string, b: string) {
    fireEvent.change(screen.getByLabelText(/^Nueva contraseña/), { target: { value: a } });
    fireEvent.change(screen.getByLabelText(/^Confirmar contraseña/), { target: { value: b } });
  }

  it("valida coincidencia y código completo, y guarda la nueva contraseña", async () => {
    const { http } = renderReset({ "POST /auth/reset-password-user": { message: "ok" } });
    fillPasswords("Secreta1!", "Otra1!");
    expect(screen.getAllByText("Las contraseñas no coinciden.").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Guardar nueva contraseña" }));

    fillPasswords("Secreta1!", "Secreta1!");
    fireEvent.click(screen.getByRole("button", { name: "Guardar nueva contraseña" }));
    expect(await screen.findByText("Ingresa el código completo.")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "Mostrar contraseña" })[0]);
    expect((screen.getByLabelText(/^Nueva contraseña/) as HTMLInputElement).type).toBe("text");
    fireEvent.click(screen.getAllByRole("button", { name: "Mostrar contraseña" })[0]);

    typeCode("654321", "Código de recuperación");
    fireEvent.click(screen.getByRole("button", { name: "Guardar nueva contraseña" }));
    expect(await screen.findByText("PÁGINA LOGIN")).toBeTruthy();
    expect(http.calls("POST /auth/reset-password-user")[0].body).toEqual({
      email: "ana@rehni.test",
      code: "654321",
      new_password: "Secreta1!",
    });
  });

  it.each([
    ["INVALID_CODE", "El código es incorrecto."],
    ["CODE_ALREADY_USED", "El código ya fue usado."],
    ["OTRO", "Contraseña débil."],
  ])("error %s muestra el mensaje del backend", async (code, message) => {
    renderReset({ "POST /auth/reset-password-user": apiError(400, code, message) });
    fillPasswords("Secreta1!", "Secreta1!");
    typeCode("111111", "Código de recuperación");
    fireEvent.click(screen.getByRole("button", { name: "Guardar nueva contraseña" }));
    expect((await screen.findAllByText(message)).length).toBeGreaterThan(0);
  });
});

describe("Configuración de cuenta", () => {
  function renderSettings(routes: Record<string, unknown> = {}) {
    return renderApp("/user/dashboard?tab=profile", { role: "user", routes });
  }

  it("edita nombre y teléfono con validación y refresca el perfil", async () => {
    let profile = profileFor("user");
    const { http } = renderSettings({
      "GET /auth/me": () => profile,
      "PATCH /auth/me": (req: { body: { fullName: string; tell: string } }) => {
        profile = { ...profile, name: req.body.fullName, tell: req.body.tell };
        return profile;
      },
    });
    expect(await screen.findByDisplayValue("Cuenta user")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Editar perfil" }));
    fireEvent.change(screen.getByLabelText(/^Nombre/), { target: { value: "Al" } });
    fireEvent.click(screen.getByRole("button", { name: /^Guardar$/ }));
    expect(await screen.findByText("El nombre debe tener al menos 3 caracteres.")).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/^Nombre/), { target: { value: " Ana Gómez " } });
    fireEvent.change(screen.getByLabelText(/^Teléfono/), { target: { value: "300-12" } });
    fireEvent.click(screen.getByRole("button", { name: /^Guardar$/ }));
    expect(await screen.findByText("El teléfono debe tener exactamente 10 dígitos.")).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/^Teléfono/), { target: { value: "3009998877" } });
    fireEvent.click(screen.getByRole("button", { name: /^Guardar$/ }));
    expect(await screen.findByDisplayValue("Ana Gómez")).toBeTruthy();
    expect(http.calls("PATCH /auth/me")[0].body).toEqual({ fullName: "Ana Gómez", tell: "3009998877" });
  });

  it("foto de perfil: rechaza PDF y sube una imagen válida", async () => {
    const { http } = renderSettings({ "PATCH /auth/me/photo": profileFor("user") });
    await screen.findByDisplayValue("Cuenta user");
    const input = document.querySelector('main input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile("cv.pdf", "application/pdf")] } });
    expect(await screen.findByText("Foto de perfil: solo se admite JPEG, PNG, WEBP.")).toBeTruthy();
    fireEvent.change(input, { target: { files: [makeFile("vacia.png", "image/png", 0)] } });
    expect(await screen.findByText("Foto de perfil: el archivo está vacío.")).toBeTruthy();

    const photo = makeFile("yo.png", "image/png");
    fireEvent.change(input, { target: { files: [photo] } });
    fireEvent.click(screen.getByRole("button", { name: /Guardar foto/ }));
    await waitFor(() => expect(http.calls("PATCH /auth/me/photo")).toHaveLength(1));
    expect(formDataToObject(http.calls("PATCH /auth/me/photo")[0].body)).toEqual({ photo });
    await waitFor(() => expect(screen.queryByRole("button", { name: /Guardar foto/ })).toBeNull());
  });

  it("un 415 del backend al subir la foto avisa", async () => {
    renderSettings({ "PATCH /auth/me/photo": apiError(415, "UNSUPPORTED_FILE_TYPE", "Foto: formato no admitido.") });
    await screen.findByDisplayValue("Cuenta user");
    const input = document.querySelector('main input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile("yo.webp", "image/webp")] } });
    fireEvent.click(screen.getByRole("button", { name: /Guardar foto/ }));
    expect(await screen.findByText("No se pudo actualizar la foto de perfil. Intenta de nuevo.")).toBeTruthy();
  });

  it("cambiar el correo: vacío no se envía; si ya existe se avisa", async () => {
    const { http } = renderSettings({
      "PATCH /auth/me": apiError(409, "EMAIL_ALREADY_EXISTS", "El correo ya está registrado."),
    });
    await screen.findByDisplayValue("user@rehni.test");
    fireEvent.click(screen.getByRole("button", { name: "Editar correo" }));
    fireEvent.change(screen.getByLabelText(/^Correo electrónico/), { target: { value: "  " } });
    fireEvent.click(screen.getByRole("button", { name: /^Guardar$/ }));
    expect(await screen.findByText("Ingresa un correo electrónico válido.")).toBeTruthy();
    expect(http.calls("PATCH /auth/me")).toHaveLength(0);

    fireEvent.change(screen.getByLabelText(/^Correo electrónico/), { target: { value: " otra@rehni.test " } });
    fireEvent.click(screen.getByRole("button", { name: /^Guardar$/ }));
    expect(await screen.findByText("No se pudo actualizar el correo. Es posible que ya esté en uso.")).toBeTruthy();
    expect(http.calls("PATCH /auth/me")[0].body).toEqual({ email: "otra@rehni.test" });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  });

  it("cambiar contraseña envía el código al correo y abre el restablecimiento", async () => {
    const { http } = renderSettings({ "POST /auth/forgot-password-user": { message: "ok" } });
    await screen.findByDisplayValue("user@rehni.test");
    fireEvent.click(screen.getByRole("button", { name: /Cambiar contraseña/ }));
    const dialog = await screen.findByRole("dialog", { name: "Cambiar contraseña" });
    expect(within(dialog).getByText(/user@rehni\.test/)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Enviar código" }));
    expect(await screen.findByRole("heading", { name: "Nueva contraseña" })).toBeTruthy();
    expect(http.calls("POST /auth/forgot-password-user")[0].body).toEqual({ email: "user@rehni.test" });
  });

  it("si el envío del código falla lo informa; si falla el perfil también", async () => {
    renderSettings({ "POST /auth/forgot-password-user": reply(500), "PATCH /auth/me": reply(500) });
    await screen.findByDisplayValue("user@rehni.test");
    fireEvent.click(screen.getByRole("button", { name: /Cambiar contraseña/ }));
    fireEvent.click(within(await screen.findByRole("dialog", { name: "Cambiar contraseña" })).getByRole("button", { name: "Enviar código" }));
    expect(await screen.findByText("No se pudo enviar el código. Intenta de nuevo más tarde.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Editar perfil" }));
    fireEvent.click(screen.getByRole("button", { name: /^Guardar$/ }));
    expect(await screen.findByText("No se pudo actualizar el perfil. Intenta de nuevo.")).toBeTruthy();
  });
});
