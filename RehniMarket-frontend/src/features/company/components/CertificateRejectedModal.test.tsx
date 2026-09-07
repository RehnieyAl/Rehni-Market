import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import CertificateRejectedModal from "./CertificateRejectedModal";
import type { CertificateNoticeStatus } from "./CertificateRejectedModal";

function renderModal(
  status: CertificateNoticeStatus,
  reason: string | null = "Falta la firma del representante legal",
) {
  const onClose = vi.fn();

  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route
          path="/"
          element={
            <CertificateRejectedModal status={status} reason={reason} onClose={onClose} />
          }
        />
        <Route path="/actualizar-certificado" element={<p>página de actualización</p>} />
      </Routes>
    </MemoryRouter>,
  );

  return { onClose };
}

describe("CertificateRejectedModal", () => {
  it("no renderiza nada cuando status es null", () => {
    renderModal(null);
    expect(screen.queryByRole("dialog")).not.toBeTruthy();
  });

  describe("needs_update", () => {
    it("título 'Certificado no válido' + motivo real + botón de actualizar", () => {
      renderModal("needs_update");
      expect(screen.getByText("Certificado no válido")).toBeTruthy();
      expect(screen.getByText("Falta la firma del representante legal")).toBeTruthy();
      expect(
        screen.getByRole("button", { name: /actualizar certificado/i }),
      ).toBeTruthy();
      expect(screen.queryByRole("button", { name: /entendido/i })).not.toBeTruthy();
    });

    it("'Actualizar certificado' navega a /actualizar-certificado (y a ningún dashboard)", () => {
      renderModal("needs_update");
      fireEvent.click(screen.getByRole("button", { name: /actualizar certificado/i }));
      expect(screen.getByText("página de actualización")).toBeTruthy();
    });

    it("muestra un mensaje de respaldo si no hay motivo registrado", () => {
      renderModal("needs_update", null);
      expect(screen.getByText(/no registró un motivo/i)).toBeTruthy();
    });
  });

  describe("rejected", () => {
    it("título 'Empresa rechazada' + motivo real + solo botón 'Entendido'", () => {
      renderModal("rejected", "La empresa no cumple los requisitos de registro.");
      expect(screen.getByText("Empresa rechazada")).toBeTruthy();
      expect(
        screen.getByText("La empresa no cumple los requisitos de registro."),
      ).toBeTruthy();
      expect(screen.getByRole("button", { name: /entendido/i })).toBeTruthy();
      expect(
        screen.queryByRole("button", { name: /actualizar certificado/i }),
      ).not.toBeTruthy();
    });

    it("'Entendido' cierra el modal", () => {
      const { onClose } = renderModal("rejected");
      fireEvent.click(screen.getByRole("button", { name: /entendido/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("el botón de cerrar (X) invoca onClose", () => {
    const { onClose } = renderModal("needs_update");
    fireEvent.click(screen.getByRole("button", { name: /cerrar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Escape cierra el modal", () => {
    const { onClose } = renderModal("needs_update");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
