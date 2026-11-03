import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import RequestReturnModal from "./RequestReturnModal";

const requestReturn = vi.fn();
const showAlert = vi.fn();

vi.mock("../api/returnService", () => ({
  requestReturn: (...args: unknown[]) => requestReturn(...args),
}));

vi.mock("@/shared/components/alert/useAlert", () => ({
  useAlert: () => ({ showAlert, closeAlert: vi.fn() }),
}));

const MIN = "Cuéntanos el motivo de la devolución (mínimo 5 caracteres).";

function setup() {
  const onClose = vi.fn();
  const onSubmitted = vi.fn();
  render(
    <RequestReturnModal
      orderId="order-1"
      item={{ id: "item-1", productName: "Zapato", variantName: "Talla 40" }}
      isOpen
      onClose={onClose}
      onSubmitted={onSubmitted}
    />,
  );
  return { user: userEvent.setup(), onClose, onSubmitted };
}

const reason = () => screen.getByLabelText(/^Motivo de la devolución/);
const send = () => screen.getByRole("button", { name: /enviar solicitud/i });

describe("RequestReturnModal: validación del motivo", () => {
  beforeEach(() => {
    requestReturn.mockReset();
    showAlert.mockReset();
  });

  it("el botón empieza deshabilitado y sin error visible", () => {
    setup();

    expect((send() as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByText(MIN)).toBeNull();
  });

  it("muestra el mensaje del backend mientras el motivo es demasiado corto", async () => {
    const { user } = setup();

    await user.type(reason(), "Roto");

    expect(screen.getByText(MIN)).toBeTruthy();
    expect((send() as HTMLButtonElement).disabled).toBe(true);
  });

  it("los espacios no cuentan para el mínimo", async () => {
    const { user } = setup();

    await user.type(reason(), "  Roto    ");

    expect(screen.getByText(MIN)).toBeTruthy();
  });

  it("muestra el error al salir del campo vacío", async () => {
    const { user } = setup();

    await user.click(reason());
    await user.tab();

    expect(screen.getByText(MIN)).toBeTruthy();
  });

  it("limita el campo a 500 caracteres", () => {
    setup();

    expect(reason().getAttribute("maxlength")).toBe("500");
  });

  it("con un motivo válido envía el texto recortado", async () => {
    requestReturn.mockResolvedValue({});
    const { user, onSubmitted, onClose } = setup();

    await user.type(reason(), "  Llegó con la talla equivocada  ");
    expect(screen.queryByText(MIN)).toBeNull();

    await user.click(send());

    expect(requestReturn).toHaveBeenCalledWith("order-1", {
      orderItemId: "item-1",
      reason: "Llegó con la talla equivocada",
    });
    expect(onSubmitted).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
