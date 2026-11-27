import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AxiosError } from "axios";

import UpdateCertificate from "./UpdateCertificate";
import { AuthProvider } from "@/features/public/auth/context/AuthProvider";

const updateCompanyCertificate = vi.fn();
const getProfile = vi.fn();

vi.mock("@/features/public/auth/api/certificateService", () => ({
  updateCompanyCertificate: (...args: unknown[]) => updateCompanyCertificate(...args),
}));
vi.mock("@/features/public/auth/api/authService", () => ({
  getProfile: (...args: unknown[]) => getProfile(...args),
}));

function renderPage() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/actualizar-certificado"]}>
        <UpdateCertificate />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("UpdateCertificate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    getProfile.mockResolvedValue({
      email: "e@rehni.co",
      name: "e",
      role: "company",
      tell: "3",
      profileImagen: null,
    });
  });

  it("actualización correcta → limpia toda la sesión y muestra la confirmación", async () => {
    // sesión previa "contaminante"
    localStorage.setItem("accessToken", "stale-access");
    localStorage.setItem("refreshToken", "stale-refresh");
    localStorage.setItem("role", "company");

    updateCompanyCertificate.mockResolvedValue({
      message: "ok",
      certificateStatus: "pending",
    });

    const { container } = renderPage();

    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "empresa@rehni.co" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "secret123" },
    });

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const pdf = new File(["%PDF-1.4"], "cert.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [pdf] } });

    fireEvent.click(screen.getByRole("button", { name: /actualizar certificado/i }));

    await waitFor(() =>
      expect(screen.getByText("Certificado actualizado")).toBeTruthy(),
    );

    // toda la sesión eliminada
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(localStorage.getItem("role")).toBeNull();

    // enlace de vuelta al login
    expect(screen.getByRole("link", { name: /ir al inicio de sesión/i })).toBeTruthy();
  });

  it("credenciales incorrectas → error inline, no limpia sesión ni confirma", async () => {
    localStorage.setItem("accessToken", "keep");
    const err = new AxiosError("bad");
    err.response = { data: { detail: { code: "INVALID_CREDENTIALS" } } } as never;
    updateCompanyCertificate.mockRejectedValue(err);

    const { container } = renderPage();
    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "empresa@rehni.co" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "mala" },
    });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File(["x"], "c.pdf", { type: "application/pdf" })] },
    });
    fireEvent.click(screen.getByRole("button", { name: /actualizar certificado/i }));

    await waitFor(() =>
      expect(screen.getByText(/correo o contraseña incorrectos/i)).toBeTruthy(),
    );
    expect(screen.queryByText("Certificado actualizado")).not.toBeTruthy();
  });

  it("un archivo que no es PDF muestra el error y no se envía", () => {
    const { container } = renderPage();
    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "e@rehni.co" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "secret123" } });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(["x"], "cert.png", { type: "image/png" })] } });

    expect(screen.getByText("Certificado: solo se admite PDF.")).toBeTruthy();
    const submit = screen.getByRole("button", { name: /actualizar certificado/i }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.click(submit);
    expect(updateCompanyCertificate).not.toHaveBeenCalled();
  });

  it("un PDF de más de 5 MB se rechaza antes de enviar", () => {
    const { container } = renderPage();
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "c.pdf", { type: "application/pdf" });

    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [big] } });

    expect(screen.getByText("Certificado: el archivo supera el máximo de 5 MB.")).toBeTruthy();
  });

  it.each([
    [413, "FILE_TOO_LARGE", "Certificado: el archivo supera el máximo de 5 MB."],
    [415, "UNSUPPORTED_FILE_TYPE", "Certificado: el contenido no corresponde a un archivo PDF."],
  ])("una respuesta %i del backend muestra su mensaje", async (status, code, message) => {
    const err = new AxiosError("rechazado");
    err.response = { status, data: { detail: { code, message } } } as never;
    updateCompanyCertificate.mockRejectedValue(err);

    const { container } = renderPage();
    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "e@rehni.co" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "secret123" } });
    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [new File(["%PDF-1.4"], "c.pdf", { type: "application/pdf" })] },
    });
    fireEvent.click(screen.getByRole("button", { name: /actualizar certificado/i }));

    await waitFor(() => expect(screen.getByText(message)).toBeTruthy());
  });
});
