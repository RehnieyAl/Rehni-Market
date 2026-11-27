// Formulario de anuncio: validación de las imágenes desktop y móvil antes de enviarlas.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import AdvertisementFormModal from "./AdvertisementFormModal";

const showAlert = vi.fn();

vi.mock("@/shared/components/alert/useAlert", () => ({
  useAlert: () => ({ showAlert, closeAlert: vi.fn() }),
}));
vi.mock("@/features/public/products/api/productsService", () => ({
  getCatalogs: vi.fn().mockResolvedValue([]),
  getPublicProductDetail: vi.fn(),
  getPublicProducts: vi.fn().mockResolvedValue({ products: [] }),
}));
vi.mock("@/features/admin/api/companyService", () => ({
  getAdminCompanies: vi.fn().mockResolvedValue({ items: [] }),
  getAdminCompany: vi.fn(),
}));

function renderModal() {
  const onSubmit = vi.fn();
  const view = render(
    <AdvertisementFormModal isOpen advertisement={null} loading={false} onClose={vi.fn()} onSubmit={onSubmit} />,
  );
  const [desktop, mobile] = Array.from(view.container.querySelectorAll('input[type="file"]')) as HTMLInputElement[];
  return { desktop, mobile, onSubmit };
}

describe("AdvertisementFormModal: imágenes del anuncio", () => {
  beforeEach(() => {
    showAlert.mockReset();
    URL.createObjectURL = vi.fn(() => "blob:preview");
  });

  it("con imágenes válidas (PNG y JPG) se envía el anuncio", () => {
    const { desktop, mobile, onSubmit } = renderModal();
    const image = new File(["png"], "banner.png", { type: "image/png" });
    const mobileImage = new File(["jpg"], "movil.jpg", { type: "image/jpeg" });

    fireEvent.change(desktop, { target: { files: [image] } });
    fireEvent.change(mobile, { target: { files: [mobileImage] } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(showAlert).not.toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ image, mobileImage }));
  });

  it("un PDF como imagen se rechaza y el botón sigue bloqueado sin imagen", () => {
    const { desktop, onSubmit } = renderModal();

    fireEvent.change(desktop, { target: { files: [new File(["%PDF"], "doc.pdf", { type: "application/pdf" })] } });

    expect(showAlert).toHaveBeenCalledWith("error", "Imagen del anuncio: solo se admite JPEG, PNG, WEBP.");
    const submit = screen.getByRole("button", { name: "Guardar" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("la imagen móvil también se valida", () => {
    const { mobile } = renderModal();

    fireEvent.change(mobile, { target: { files: [new File([], "movil.webp", { type: "image/webp" })] } });

    expect(showAlert).toHaveBeenCalledWith("error", "Imagen móvil del anuncio: el archivo está vacío.");
  });
});
