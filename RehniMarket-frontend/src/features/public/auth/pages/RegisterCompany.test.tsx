import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import RegisterCompany from "./RegisterCompany";

const registerCompany = vi.fn();
const showAlert = vi.fn();

vi.mock("@/features/public/auth/api/authService", () => ({
  registerCompany: (...args: unknown[]) => registerCompany(...args),
}));

vi.mock("@/shared/components/alert/useAlert", () => ({
  useAlert: () => ({ showAlert, closeAlert: vi.fn() }),
}));

const DV_MISMATCH = "El dígito de verificación no coincide con el NIT ingresado.";

function renderForm() {
  render(
    <MemoryRouter initialEntries={["/register-company"]}>
      <Routes>
        <Route path="/register-company" element={<RegisterCompany />} />
        <Route path="/verify-email" element={<p>VERIFICAR CORREO</p>} />
      </Routes>
    </MemoryRouter>,
  );
  return userEvent.setup();
}

const field = (label: RegExp) => screen.getByLabelText(label);

async function fillValid(user: ReturnType<typeof userEvent.setup>, nit = "800197268", dv = "4") {
  await user.type(field(/^Nombre completo/), "Ana Pérez");
  await user.type(field(/^Teléfono/), "3001234567");
  await user.type(field(/^Correo electrónico/), "ana@example.com");
  await user.type(field(/^Contraseña/), "Secreto123");
  await user.type(field(/^Confirmar contraseña/), "Secreto123");
  await user.type(field(/^Nombre de la empresa/), "Tienda Ana SAS");
  await user.type(field(/^Dirección/), "Calle 10 # 20-30");
  await user.type(field(/^NIT/), nit);
  await user.type(field(/^DV/), dv);
  await user.upload(
    field(/Seleccionar archivo PDF/),
    new File(["%PDF-1.4"], "camara.pdf", { type: "application/pdf" }),
  );
  await user.click(screen.getByRole("checkbox"));
}

describe("RegisterCompany: validación en el cliente", () => {
  beforeEach(() => {
    registerCompany.mockReset();
    showAlert.mockReset();
  });

  it("avisa al salir del campo si el DV no corresponde al NIT (NIT de la DIAN, DV real 4)", async () => {
    const user = renderForm();

    await user.type(field(/^Nombre de la empresa/), "Tienda Ana SAS");
    await user.type(field(/^Dirección/), "Calle 10 # 20-30");
    await user.type(field(/^NIT/), "800197268");
    await user.type(field(/^DV/), "5");
    await user.tab();

    expect(screen.getByText(DV_MISMATCH)).toBeTruthy();

    await user.clear(field(/^DV/));
    await user.type(field(/^DV/), "4");
    expect(screen.queryByText(DV_MISMATCH)).toBeNull();
  });

  it("valida el formato del NIT antes que el dígito de verificación", async () => {
    const user = renderForm();

    await user.type(field(/^NIT/), "800.197.268");
    await user.tab();

    expect(screen.getByText("El NIT solo puede contener números.")).toBeTruthy();
    expect(screen.queryByText(DV_MISMATCH)).toBeNull();
  });

  it("no envía si el DV no coincide y muestra el error", async () => {
    const user = renderForm();

    await fillValid(user, "890903938", "7"); // Bancolombia: DV real 8
    await user.click(screen.getByRole("button", { name: /crear cuenta empresarial/i }));

    expect(screen.getByText(DV_MISMATCH)).toBeTruthy();
    expect(registerCompany).not.toHaveBeenCalled();
  });

  it("con NIT y DV reales envía el registro con el certificado", async () => {
    registerCompany.mockResolvedValue({ expires_in: 300, resend_available_in: 60 });
    const user = renderForm();

    await fillValid(user, "899999034", "1"); // SENA
    await user.click(screen.getByRole("button", { name: /crear cuenta empresarial/i }));

    expect(registerCompany).toHaveBeenCalledTimes(1);
    expect(registerCompany.mock.calls[0][0]).toMatchObject({
      company_nit: "899999034",
      company_nit_dv: "1",
      certificate: expect.objectContaining({ name: "camara.pdf" }),
    });
    expect(await screen.findByText("VERIFICAR CORREO")).toBeTruthy();
  });
});
