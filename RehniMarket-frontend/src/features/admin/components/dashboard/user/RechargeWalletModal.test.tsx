import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import RechargeWalletModal from "./RechargeWalletModal";

vi.mock("@/features/wallet/api/walletService", () => ({
  rechargeWallet: vi.fn().mockResolvedValue({ balance: "0" }),
}));

vi.mock("@/shared/components/alert/useAlert", () => ({
  useAlert: () => ({ showAlert: vi.fn(), closeAlert: vi.fn() }),
}));

function setup() {
  const onClose = vi.fn();
  render(
    <RechargeWalletModal isOpen userId="u1" userName="Juan Pérez" onClose={onClose} />,
  );
  return { onClose };
}

const rechargeBtn = () =>
  screen.getByRole("button", { name: "Recargar" }) as HTMLButtonElement;
const amountInput = () => screen.getByPlaceholderText("0") as HTMLInputElement;

describe("RechargeWalletModal · límite de recarga", () => {
  it("muestra el monto máximo de recarga", () => {
    setup();
    expect(screen.getByText("Monto máximo de recarga: $10.000.000")).toBeTruthy();
  });

  it("Recargar deshabilitado sin monto", () => {
    setup();
    expect(rechargeBtn().disabled).toBe(true);
  });

  it("permite montos válidos: $1, $100.000, $10.000.000", () => {
    setup();
    for (const value of ["1", "100000", "10000000"]) {
      fireEvent.change(amountInput(), { target: { value } });
      expect(rechargeBtn().disabled).toBe(false);
    }
  });

  it("impide confirmar $10.000.001 y muestra el mensaje del límite", () => {
    setup();
    fireEvent.change(amountInput(), { target: { value: "10000001" } });
    expect(rechargeBtn().disabled).toBe(true);
    expect(
      screen.getByText("El monto máximo de recarga es de $10.000.000."),
    ).toBeTruthy();
  });

  it("impide confirmar $20.000.000", () => {
    setup();
    fireEvent.change(amountInput(), { target: { value: "20000000" } });
    expect(rechargeBtn().disabled).toBe(true);
  });

  it("no pierde el foco del input al escribir un valor sobre el límite", () => {
    setup();
    const input = amountInput();
    input.focus();
    fireEvent.change(input, { target: { value: "10000001" } });
    expect(document.activeElement).toBe(input);
    fireEvent.change(input, { target: { value: "10000001234" } });
    expect(input.value).toBe("10000001234");
    expect(document.activeElement).toBe(input);
  });
});
