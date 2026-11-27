// RehniCoin del admin: recarga por correo con tope por operación, historial y corrección.
import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";

import RehniCoin from "./RehniCoin";
import { renderWithProviders } from "@/test/renderApp";
import { apiError } from "@/test/http";

const ITEM = {
  id: "t1",
  createdAt: "2026-11-01T10:00:00Z",
  userName: "Ana",
  userEmail: "ana@rehni.test",
  amount: "50000",
  description: null,
  createdByName: "Admin Uno",
  createdByEmail: "admin@rehni.test",
  isCorrected: false,
};
const CORRECTED = { ...ITEM, id: "t2", userName: "Luis", isCorrected: true, createdByName: null, createdByEmail: null };

function page(items: unknown[], extra = {}) {
  return { items, total: items.length, page: 1, limit: 10, total_pages: 1, ...extra };
}

function fill(email: string, amount: string, description = "") {
  fireEvent.change(screen.getByLabelText(/Correo del usuario/), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/Cantidad \(RC\)/), { target: { value: amount } });
  fireEvent.change(screen.getByLabelText(/Descripción/), { target: { value: description } });
}

describe("Admin · RehniCoin", () => {
  it("historial con responsable y recargas ya corregidas", async () => {
    renderWithProviders(<RehniCoin />, { routes: { "GET /admin/wallet/history": page([ITEM, CORRECTED]) } });
    expect(await screen.findByText("Ana")).toBeTruthy();
    expect(screen.getAllByText("$50.000 RC", { exact: false })).toHaveLength(2);
    expect(screen.getByText(/Admin Uno/)).toBeTruthy();
    expect(screen.getByText("Corregida")).toBeTruthy();
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("historial vacío y paginado", async () => {
    const { http } = renderWithProviders(<RehniCoin />, {
      routes: {
        "GET /admin/wallet/history": (req: { params: Record<string, string> }) =>
          req.params.page === "2" ? page([], { total_pages: 2 }) : page([ITEM], { total_pages: 2 }),
      },
    });
    await screen.findByText("Ana");
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(await screen.findByText("Todavía no se han registrado recargas")).toBeTruthy();
    expect(screen.getByText("Página 2 de 2")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    await waitFor(() => expect(http.requests.at(-1)?.params.page).toBe("1"));
  });

  it("valida el tope por operación y no envía montos inválidos", async () => {
    renderWithProviders(<RehniCoin />, { routes: { "GET /admin/wallet/history": page([]) } });
    await screen.findByText("Todavía no se han registrado recargas");
    const submit = screen.getByRole("button", { name: "Recargar saldo" }) as HTMLButtonElement;

    fill("ana@rehni.test", "10000001");
    expect(screen.getByText("El monto máximo de recarga es de $10.000.000.")).toBeTruthy();
    expect(submit.disabled).toBe(true);

    fill("ana@rehni.test", "0");
    expect(submit.disabled).toBe(true);
    fill("ana@rehni.test", "abc");
    expect(submit.disabled).toBe(true);
    fill("", "1000");
    expect(submit.disabled).toBe(true);
  });

  it("recarga exitosa informa el nuevo saldo, limpia el formulario y recarga el historial", async () => {
    const { http } = renderWithProviders(<RehniCoin />, {
      routes: {
        "GET /admin/wallet/history": page([]),
        "POST /admin/wallet/recharge": { balance: "75000", userName: "Ana", userEmail: "ana@rehni.test" },
      },
    });
    await screen.findByText("Todavía no se han registrado recargas");
    fill(" ana@rehni.test ", "25000", "  Bono  ");
    fireEvent.click(screen.getByRole("button", { name: "Recargar saldo" }));

    expect(await screen.findByText("Recarga exitosa a Ana (ana@rehni.test). Nuevo saldo: $75.000 RC")).toBeTruthy();
    expect(http.calls("POST /admin/wallet/recharge")[0].body).toEqual({
      email: "ana@rehni.test",
      amount: 25000,
      description: "Bono",
    });
    expect((screen.getByLabelText(/Correo del usuario/) as HTMLInputElement).value).toBe("");
    await waitFor(() => expect(http.calls("GET /admin/wallet/history").length).toBe(2));
  });

  it("un correo inexistente muestra el mensaje del backend", async () => {
    renderWithProviders(<RehniCoin />, {
      routes: {
        "GET /admin/wallet/history": page([]),
        "POST /admin/wallet/recharge": apiError(404, "USER_NOT_FOUND", "No existe un usuario con ese correo."),
      },
    });
    await screen.findByText("Todavía no se han registrado recargas");
    fill("nadie@rehni.test", "1000");
    fireEvent.click(screen.getByRole("button", { name: "Recargar saldo" }));
    expect((await screen.findAllByText("No existe un usuario con ese correo.")).length).toBeGreaterThan(0);
  });

  it("corregir una recarga informa el ajuste negativo y el nuevo saldo", async () => {
    const { http } = renderWithProviders(<RehniCoin />, {
      routes: {
        "GET /admin/wallet/history": page([ITEM]),
        "POST /admin/wallet/recharge/:id/correction": {
          balance: "30000",
          userName: "Ana",
          userEmail: "ana@rehni.test",
          originalAmount: "50000",
          newAmount: "30000",
          adjustment: "-20000",
          correctionTransactionId: "t9",
        },
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Corregir recarga/ }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Nueva cantidad correcta/), { target: { value: "30000" } });
    fireEvent.change(within(dialog).getByLabelText(/Motivo de la corrección/), { target: { value: "Se digitó de más" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Corregir recarga" }));

    expect(await screen.findByText("Recarga corregida para Ana. Ajuste -$20.000 RC · nuevo saldo $30.000 RC.")).toBeTruthy();
    expect(http.calls("POST /admin/wallet/recharge/:id/correction")[0].body).toEqual({
      newAmount: 30000,
      reason: "Se digitó de más",
    });
  });
});
