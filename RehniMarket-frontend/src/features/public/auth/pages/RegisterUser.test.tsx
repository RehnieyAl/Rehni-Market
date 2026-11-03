import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import RegisterUser from "./RegisterUser";

const registerUser = vi.fn();
const showAlert = vi.fn();

vi.mock("@/features/public/auth/api/authService", () => ({
  registerUser: (...args: unknown[]) => registerUser(...args),
}));

vi.mock("@/shared/components/alert/useAlert", () => ({
  useAlert: () => ({ showAlert, closeAlert: vi.fn() }),
}));

function renderForm() {
  render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<RegisterUser />} />
        <Route path="/verify-email" element={<p>VERIFICAR CORREO</p>} />
      </Routes>
    </MemoryRouter>,
  );
  return userEvent.setup();
}

const field = (label: RegExp) => screen.getByLabelText(label);
const submit = () => screen.getByRole("button", { name: /crear cuenta/i });

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(field(/^Nombre completo/), "Ana Pérez");
  await user.type(field(/^Teléfono/), "3001234567");
  await user.type(field(/^Correo electrónico/), "ana@example.com");
  await user.type(field(/^Contraseña/), "Secreto123");
  await user.type(field(/^Confirmar contraseña/), "Secreto123");
  await user.click(screen.getByRole("checkbox"));
}

describe("RegisterUser: validación en el cliente", () => {
  beforeEach(() => {
    registerUser.mockReset();
    showAlert.mockReset();
  });

  it("muestra el error de un campo al salir de él, antes de enviar", async () => {
    const user = renderForm();

    await user.type(field(/^Nombre completo/), "An");
    await user.tab();

    expect(
      screen.getByText("El nombre completo debe tener al menos 3 caracteres."),
    ).toBeTruthy();
    expect(field(/^Nombre completo/).getAttribute("aria-invalid")).toBe("true");
  });

  it("no muestra errores de campos que el usuario aún no ha tocado", async () => {
    const user = renderForm();

    await user.type(field(/^Nombre completo/), "An");

    expect(screen.queryByText(/número de teléfono/)).toBeNull();
    expect(screen.queryByText(/El nombre completo/)).toBeNull();
  });

  it("el error desaparece al corregir el valor", async () => {
    const user = renderForm();

    await user.type(field(/^Teléfono/), "300123");
    await user.tab();
    expect(screen.getByText("El número de teléfono debe tener exactamente 10 dígitos.")).toBeTruthy();

    await user.type(field(/^Teléfono/), "4567");
    expect(screen.queryByText(/El número de teléfono/)).toBeNull();
  });

  it("avisa que las contraseñas no coinciden mientras se escribe", async () => {
    const user = renderForm();

    await user.type(field(/^Contraseña/), "Secreto123");
    await user.type(field(/^Confirmar contraseña/), "Secreto12");

    expect(screen.getByText("Las contraseñas no coinciden.")).toBeTruthy();
  });

  it("al enviar con errores los muestra todos y no llama al backend", async () => {
    const user = renderForm();

    await fillValid(user);
    await user.clear(field(/^Teléfono/));
    await user.type(field(/^Teléfono/), "12ab");
    await user.clear(field(/^Contraseña/));
    await user.type(field(/^Contraseña/), "secreto123");
    await user.click(submit());

    expect(screen.getByText("El número de teléfono solo puede contener números.")).toBeTruthy();
    expect(
      screen.getByText("La contraseña debe contener al menos una letra mayúscula."),
    ).toBeTruthy();
    expect(registerUser).not.toHaveBeenCalled();
  });

  it("con datos válidos envía el formulario y navega a verificar correo", async () => {
    registerUser.mockResolvedValue({ expires_in: 300, resend_available_in: 60 });
    const user = renderForm();

    await fillValid(user);
    await user.click(submit());

    expect(registerUser).toHaveBeenCalledWith({
      full_name: "Ana Pérez",
      email: "ana@example.com",
      password: "Secreto123",
      tell: "3001234567",
    });
    expect(await screen.findByText("VERIFICAR CORREO")).toBeTruthy();
  });
});
