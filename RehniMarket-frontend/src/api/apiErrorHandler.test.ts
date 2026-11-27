// Alertas de errores HTTP de archivos: mensajes del backend para 413/415 y respaldo sin JSON.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosError } from "axios";

import { handleApiError } from "./apiErrorHandler";

const showGlobalAlert = vi.fn();

vi.mock("@/shared/components/alert/alertManager", () => ({
  showGlobalAlert: (...args: unknown[]) => showGlobalAlert(...args),
}));

function httpError(status: number, data?: unknown) {
  const error = new AxiosError("fallo");
  error.response = { status, data } as never;
  return error;
}

describe("handleApiError con archivos", () => {
  beforeEach(() => showGlobalAlert.mockReset());

  it("muestra el mensaje del backend para 413", () => {
    handleApiError(httpError(413, { detail: { code: "FILE_TOO_LARGE", message: "Logo: el archivo supera el máximo de 5 MB." } }));

    expect(showGlobalAlert).toHaveBeenCalledWith("error", "Logo: el archivo supera el máximo de 5 MB.");
  });

  it("muestra el mensaje del backend para 415", () => {
    handleApiError(httpError(415, { detail: { code: "UNSUPPORTED_FILE_TYPE", message: "Certificado: solo se admite PDF." } }));

    expect(showGlobalAlert).toHaveBeenCalledWith("error", "Certificado: solo se admite PDF.");
  });

  it("explica un 413 del proxy que llega sin JSON", () => {
    handleApiError(httpError(413, "<html>413 Request Entity Too Large</html>"));

    expect(showGlobalAlert).toHaveBeenCalledWith("error", "El archivo supera el máximo de 5 MB.");
  });

  it("explica un 415 sin detalle", () => {
    handleApiError(httpError(415));

    expect(showGlobalAlert).toHaveBeenCalledWith("error", "Formato de archivo no admitido.");
  });
});
