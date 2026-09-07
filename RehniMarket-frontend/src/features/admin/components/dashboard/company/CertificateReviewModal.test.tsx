import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import CertificateReviewModal from "./CertificateReviewModal";

function setup() {
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  render(
    <CertificateReviewModal
      isOpen
      companyName="ACME S.A.S"
      onConfirm={onConfirm}
      onClose={onClose}
    />,
  );
  return { onConfirm, onClose };
}

const confirmBtn = () =>
  screen.getByRole("button", { name: "Confirmar" }) as HTMLButtonElement;
const textarea = () => screen.getByRole("textbox") as HTMLTextAreaElement;
const rejectOption = () => screen.getByRole("radio", { name: /^Rechazar/i });
const invalidOption = () =>
  screen.getByRole("radio", { name: /^Certificado inválido/i });

describe("CertificateReviewModal", () => {
  it("muestra el título, las dos opciones y el motivo obligatorio", () => {
    setup();
    expect(screen.getByText("Revisar certificado")).toBeTruthy();
    expect(rejectOption()).toBeTruthy();
    expect(invalidOption()).toBeTruthy();
    expect(screen.getByText("Motivo")).toBeTruthy();
    expect(screen.getByText("Este motivo será mostrado a la empresa.")).toBeTruthy();
  });

  it("Confirmar está deshabilitado sin acción seleccionada", () => {
    setup();
    fireEvent.change(textarea(), { target: { value: "un motivo" } });
    expect(confirmBtn().disabled).toBe(true);
  });

  it("Confirmar está deshabilitado con motivo vacío o solo espacios", () => {
    setup();
    fireEvent.click(rejectOption());
    expect(confirmBtn().disabled).toBe(true);

    fireEvent.change(textarea(), { target: { value: "   \n  " } });
    expect(confirmBtn().disabled).toBe(true);
  });

  it("acepta texto largo con saltos de línea y no cierra el modal al escribir", () => {
    const { onClose } = setup();
    fireEvent.click(invalidOption());

    const long =
      "El PDF está ilegible.\nLa fecha de expedición no se ve.\nFalta el sello.\n".repeat(4);
    fireEvent.change(textarea(), { target: { value: long } });

    expect(textarea().value).toBe(long);
    expect(confirmBtn().disabled).toBe(false);
    expect(screen.getByText("Revisar certificado")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("confirma 'rejected' con el motivo recortado", () => {
    const { onConfirm } = setup();
    fireEvent.click(rejectOption());
    fireEvent.change(textarea(), {
      target: { value: "  La empresa no cumple los requisitos.  " },
    });
    fireEvent.click(confirmBtn());
    expect(onConfirm).toHaveBeenCalledWith(
      "rejected",
      "La empresa no cumple los requisitos.",
    );
  });

  it("confirma 'needs_update' cuando se elige 'Certificado inválido'", () => {
    const { onConfirm } = setup();
    fireEvent.click(invalidOption());
    fireEvent.change(textarea(), { target: { value: "Certificado vencido" } });
    fireEvent.click(confirmBtn());
    expect(onConfirm).toHaveBeenCalledWith("needs_update", "Certificado vencido");
  });

  it("Cancelar cierra sin confirmar", () => {
    const { onConfirm, onClose } = setup();
    fireEvent.click(rejectOption());
    fireEvent.change(textarea(), { target: { value: "algo" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
