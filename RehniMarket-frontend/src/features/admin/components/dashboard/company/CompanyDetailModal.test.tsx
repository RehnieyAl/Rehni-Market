import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import CompanyDetailModal from "./CompanyDetailModal";

const getAdminCompany = vi.fn();
const updateCertificateStatus = vi.fn();
const getAdminUserById = vi.fn();

vi.mock("@/features/admin/api/companyService", () => ({
  getAdminCompany: (...args: unknown[]) => getAdminCompany(...args),
  updateCertificateStatus: (...args: unknown[]) => updateCertificateStatus(...args),
}));

vi.mock("@/features/admin/api/userService", () => ({
  getAdminUserById: (...args: unknown[]) => getAdminUserById(...args),
}));

const PENDING_COMPANY = {
  id: "company-1",
  nameCompany: "ACME S.A.S",
  CompanyNIT: "900123456",
  CompanyNITDV: "7",
  CompanyLogo: null,
  CompanyBanner: null,
  CompanyCertificate: "https://cdn.test/cert.pdf",
  CompanyCertificateStatus: "pending" as const,
  CompanyStatus: true,
  suspensionReason: null,
  rejectionReason: null,
  addressCompany: "Calle 1",
  user_id: "user-1",
  created_at: "2026-01-01T00:00:00Z",
};

const REPRESENTATIVE = {
  id: "user-1",
  fullName: "Jordan Pérez",
  email: "rep@acme.test",
  tell: "3000000000",
  profileImagen: null,
  role: "company",
  isActive: true,
  created_at: "2026-01-01T00:00:00Z",
};

function renderModal() {
  return render(
    <MemoryRouter>
      <CompanyDetailModal companyId="company-1" isOpen onClose={vi.fn()} />
    </MemoryRouter>,
  );
}

async function openReviewModal() {
  renderModal();
  const trigger = await screen.findByRole("button", {
    name: "Rechazar o solicitar cambios",
  });
  fireEvent.click(trigger);
  await screen.findByText("Revisar certificado");
}

describe("CompanyDetailModal — revisión de certificado", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminCompany.mockResolvedValue({ ...PENDING_COMPANY });
    updateCertificateStatus.mockResolvedValue(undefined);
    getAdminUserById.mockResolvedValue({ ...REPRESENTATIVE });
  });

  it("el botón abre el modal de revisión con las dos opciones", async () => {
    await openReviewModal();

    expect(screen.getByRole("radio", { name: /^Rechazar/i })).toBeTruthy();
    expect(
      screen.getByRole("radio", { name: /^Certificado inválido/i }),
    ).toBeTruthy();
    // el detalle de empresa queda oculto mientras se revisa
    expect(screen.queryByText("Detalle de empresa")).not.toBeTruthy();
  });

  it("envía 'rejected' + motivo al confirmar la opción Rechazar", async () => {
    await openReviewModal();

    fireEvent.click(screen.getByRole("radio", { name: /^Rechazar/i }));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "  Documentos no válidos  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() =>
      expect(updateCertificateStatus).toHaveBeenCalledWith(
        "company-1",
        "rejected",
        "Documentos no válidos",
      ),
    );
  });

  it("envía 'needs_update' + motivo al confirmar la opción Certificado inválido", async () => {
    await openReviewModal();

    fireEvent.click(screen.getByRole("radio", { name: /^Certificado inválido/i }));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "El certificado está vencido" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() =>
      expect(updateCertificateStatus).toHaveBeenCalledWith(
        "company-1",
        "needs_update",
        "El certificado está vencido",
      ),
    );
  });

  it("Cancelar vuelve al detalle sin llamar al backend", async () => {
    await openReviewModal();

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "algo" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    await screen.findByText("Detalle de empresa");
    expect(updateCertificateStatus).not.toHaveBeenCalled();
  });
});
