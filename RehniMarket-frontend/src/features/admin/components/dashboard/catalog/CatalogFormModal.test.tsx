// Formulario de categoría: validación de la imagen (formato, vacía, 5 MB) antes de enviarla.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import CatalogFormModal from "./CatalogFormModal";

const showAlert = vi.fn();

vi.mock("@/shared/components/alert/useAlert", () => ({
  useAlert: () => ({ showAlert, closeAlert: vi.fn() }),
}));

function renderModal(onSubmit = vi.fn()) {
  const view = render(
    <CatalogFormModal isOpen catalog={null} loading={false} onClose={vi.fn()} onSubmit={onSubmit} />,
  );
  fireEvent.change(screen.getByPlaceholderText("Ej: Computadoras"), { target: { value: "Mascotas" } });
  const input = view.container.querySelector('input[type="file"]') as HTMLInputElement;
  return { input, onSubmit };
}

describe("CatalogFormModal: imagen de la categoría", () => {
  beforeEach(() => {
    showAlert.mockReset();
    URL.createObjectURL = vi.fn(() => "blob:preview");
  });

  it("una imagen WEBP válida se envía con el formulario", () => {
    const { input, onSubmit } = renderModal();
    const image = new File(["webp"], "gato.webp", { type: "image/webp" });

    fireEvent.change(input, { target: { files: [image] } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(showAlert).not.toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ image }));
  });

  it.each([
    ["gato.gif", "image/gif", 3, "Imagen de la categoría: solo se admite JPEG, PNG, WEBP."],
    ["vacia.png", "image/png", 0, "Imagen de la categoría: el archivo está vacío."],
    ["grande.jpg", "image/jpeg", 5 * 1024 * 1024 + 1, "Imagen de la categoría: el archivo supera el máximo de 5 MB."],
  ])("rechaza %s, avisa y no la envía", (name, type, size, message) => {
    const file = new File([new Uint8Array(size)], name, { type });
    const { input, onSubmit } = renderModal();

    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(showAlert).toHaveBeenCalledWith("error", message);
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ image: null }));
  });
});
