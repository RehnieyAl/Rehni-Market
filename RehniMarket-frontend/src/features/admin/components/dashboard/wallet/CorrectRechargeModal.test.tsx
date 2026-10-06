import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import CorrectRechargeModal from "./CorrectRechargeModal";
import type { WalletRechargeHistoryItem } from "@/features/wallet/types/response";

const RECHARGE: WalletRechargeHistoryItem = {
  id: "tx-1",
  createdAt: "2026-09-01T12:00:00Z",
  userName: "Juan Pérez",
  userEmail: "juan@example.com",
  amount: "100000",
  description: "Recarga de saldo",
  createdByName: "Admin",
  createdByEmail: "admin@example.com",
  isCorrected: false,
};

function setup() {
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  render(
    <CorrectRechargeModal
      isOpen
      recharge={RECHARGE}
      onConfirm={onConfirm}
      onClose={onClose}
    />,
  );
  return { onConfirm, onClose };
}

const confirmBtn = () =>
  screen.getByRole("button", { name: "Corregir recarga" }) as HTMLButtonElement;
const amountInput = () =>
  screen.getByLabelText(/Nueva cantidad correcta/i) as HTMLInputElement;
const reasonInput = () =>
  screen.getByLabelText(/Motivo de la corrección/i) as HTMLTextAreaElement;

describe("CorrectRechargeModal", () => {
  it("muestra usuario, recarga original y fecha", () => {
    setup();
    expect(screen.getByRole("heading", { name: "Corregir recarga" })).toBeTruthy();
    expect(screen.getByText("Juan Pérez")).toBeTruthy();
    expect(screen.getByText(/\$100\.000/)).toBeTruthy();
  });

  it("Corregir está deshabilitado sin cantidad ni motivo", () => {
    setup();
    expect(confirmBtn().disabled).toBe(true);
  });

  it("Corregir está deshabilitado si falta el motivo (o es muy corto)", () => {
    setup();
    fireEvent.change(amountInput(), { target: { value: "50000" } });
    expect(confirmBtn().disabled).toBe(true);

    fireEvent.change(reasonInput(), { target: { value: "ab" } });
    expect(confirmBtn().disabled).toBe(true);
  });

  it("Corregir está deshabilitado con cantidad inválida (0, negativa, texto)", () => {
    setup();
    fireEvent.change(reasonInput(), { target: { value: "Recarga por error" } });

    for (const bad of ["0", "-100", "abc"]) {
      fireEvent.change(amountInput(), { target: { value: bad } });
      expect(confirmBtn().disabled).toBe(true);
    }
  });

  it("Corregir está deshabilitado si la nueva cantidad es igual a la original", () => {
    setup();
    fireEvent.change(reasonInput(), { target: { value: "Recarga por error" } });
    fireEvent.change(amountInput(), { target: { value: "100000" } });
    expect(confirmBtn().disabled).toBe(true);
    expect(screen.getByText("La cantidad corregida es igual a la original.")).toBeTruthy();
  });

  it("muestra el ajuste calculado (negativo y positivo)", () => {
    setup();
    fireEvent.change(amountInput(), { target: { value: "50000" } });
    expect(screen.getByText(/-\$50\.000/)).toBeTruthy();

    fireEvent.change(amountInput(), { target: { value: "150000" } });
    expect(screen.getByText(/\+\$50\.000/)).toBeTruthy();
  });

  it("confirma con (nuevaCantidad, motivo) y no cierra al escribir", () => {
    const { onConfirm, onClose } = setup();
    fireEvent.change(amountInput(), { target: { value: "50000" } });
    fireEvent.change(reasonInput(), { target: { value: "Se digitó un cero de más" } });

    expect(onClose).not.toHaveBeenCalled();
    expect(confirmBtn().disabled).toBe(false);

    fireEvent.click(confirmBtn());
    expect(onConfirm).toHaveBeenCalledWith(50000, "Se digitó un cero de más");
  });

  it("muestra el monto máximo de recarga", () => {
    setup();
    expect(screen.getByText(/Monto máximo de recarga: \$10\.000\.000/)).toBeTruthy();
  });

  it("permite una nueva cantidad de exactamente $10.000.000", () => {
    const { onConfirm } = setup();
    fireEvent.change(amountInput(), { target: { value: "10000000" } });
    fireEvent.change(reasonInput(), { target: { value: "Cantidad correcta" } });
    expect(confirmBtn().disabled).toBe(false);
    fireEvent.click(confirmBtn());
    expect(onConfirm).toHaveBeenCalledWith(10000000, "Cantidad correcta");
  });

  it("rechaza una nueva cantidad superior a $10.000.000", () => {
    setup();
    fireEvent.change(reasonInput(), { target: { value: "Cantidad correcta" } });
    fireEvent.change(amountInput(), { target: { value: "10000001" } });
    expect(confirmBtn().disabled).toBe(true);
    expect(
      screen.getByText("El monto máximo de recarga es de $10.000.000."),
    ).toBeTruthy();
  });
});
