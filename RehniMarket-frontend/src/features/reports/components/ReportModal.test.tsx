// Modal de reporte: validación de evidencias y envío del reporte con sus imágenes.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import ReportModal from "./ReportModal";

const createReport = vi.fn();
const showAlert = vi.fn();

vi.mock("../api/reportService", () => ({
  createReport: (...args: unknown[]) => createReport(...args),
}));
vi.mock("@/shared/components/alert/useAlert", () => ({
  useAlert: () => ({ showAlert, closeAlert: vi.fn() }),
}));

function renderModal() {
  const view = render(
    <ReportModal isOpen onClose={vi.fn()} targetType="product" targetId="p-1" targetLabel="Zapato" />,
  );
  fireEvent.change(screen.getByLabelText(/Motivo/), { target: { value: "Producto falso" } });
  return view.container.querySelector('input[type="file"]') as HTMLInputElement;
}

describe("ReportModal: evidencias", () => {
  beforeEach(() => {
    createReport.mockReset().mockResolvedValue({});
    showAlert.mockReset();
    URL.createObjectURL = vi.fn(() => "blob:preview");
    URL.revokeObjectURL = vi.fn();
  });

  it("envía las imágenes válidas como evidencia", async () => {
    const input = renderModal();
    const evidence = new File(["jpg"], "prueba.jpg", { type: "image/jpeg" });

    fireEvent.change(input, { target: { files: [evidence] } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar reporte" }));

    await waitFor(() => expect(createReport).toHaveBeenCalled());
    expect(createReport.mock.calls[0][4]).toEqual([evidence]);
  });

  it("muestra el error y no adjunta un archivo no admitido", async () => {
    const input = renderModal();

    fireEvent.change(input, { target: { files: [new File(["%PDF"], "doc.pdf", { type: "application/pdf" })] } });

    expect(screen.getByText("Evidencia: solo se admite JPEG, PNG, WEBP.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Enviar reporte" }));
    await waitFor(() => expect(createReport).toHaveBeenCalled());
    expect(createReport.mock.calls[0][4]).toEqual([]);
  });

  it("rechaza una evidencia de más de 5 MB", () => {
    const input = renderModal();

    fireEvent.change(input, {
      target: { files: [new File([new Uint8Array(5 * 1024 * 1024 + 1)], "g.png", { type: "image/png" })] },
    });

    expect(screen.getByText("Evidencia: el archivo supera el máximo de 5 MB.")).toBeTruthy();
  });
});
