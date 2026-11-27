// Cuentas bancarias de la empresa: banco del catálogo con logo, número enmascarado, precarga al editar (sin
// exponer el número), envío solo de los cambios, cuenta principal, validaciones y errores de la API.
import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";

import BankAccountsList from "./BankAccountsList";
import { renderWithProviders } from "@/test/renderApp";
import { apiError, reply } from "@/test/http";

const BANKS = [
  { id: "k1", name: "Bancolombia", logoUrl: "https://cdn.test/bancolombia.png" },
  { id: "k2", name: "Davivienda", logoUrl: null },
];

const BANCOLOMBIA = {
  id: "b1",
  accountHolder: "ACME S.A.S",
  documentNumber: "900123456",
  bankId: "k1",
  bankName: "Bancolombia",
  bankLogoUrl: "https://cdn.test/bancolombia.png",
  accountType: "savings",
  lastFourDigits: "7890",
  isDefault: true,
  createdAt: "2026-01-01",
  updatedAt: null,
};
const DAVIVIENDA = {
  ...BANCOLOMBIA,
  id: "b2",
  bankId: "k2",
  bankName: "Davivienda",
  bankLogoUrl: null,
  accountType: "checking",
  lastFourDigits: "2210",
  isDefault: false,
};
const LEGACY = { ...DAVIVIENDA, id: "b3", bankId: null, bankName: "Banco Antiguo", lastFourDigits: "1111" };

function routes(accounts: unknown[] | (() => unknown), extra: Record<string, unknown> = {}) {
  return {
    "GET /company/bank-accounts": accounts,
    "GET /company/bank-accounts/banks": BANKS,
    ...extra,
  };
}

/** El selector de banco (el icono de respaldo del logo también se llama "Banco …"). */
function bankSelect(dialog: HTMLElement) {
  return within(dialog).getByRole("combobox", { name: /^Banco/ });
}

async function openEdit(bankName: string, lastFour: string) {
  fireEvent.click(await screen.findByRole("button", { name: `Editar la cuenta de ${bankName} terminada en ${lastFour}` }));
  return screen.findByRole("dialog", { name: "Editar cuenta bancaria" });
}

describe("Empresa · cuentas bancarias", () => {
  it("lista con logo, número enmascarado, principal y secundaria; logo ausente o roto usa el icono", async () => {
    renderWithProviders(<BankAccountsList />, { routes: routes([BANCOLOMBIA, DAVIVIENDA]) });
    const items = await screen.findAllByRole("listitem");

    expect(within(items[0]).getByText("Bancolombia")).toBeTruthy();
    expect(within(items[0]).getByText("Principal")).toBeTruthy();
    expect(within(items[0]).getByText("7890")).toBeTruthy();
    expect(items[0].textContent).not.toContain("1234567890");
    const logo = within(items[0]).getByAltText("Logo de Bancolombia");
    fireEvent.error(logo);
    expect(within(items[0]).getByLabelText("Bancolombia (sin logo)")).toBeTruthy();

    expect(within(items[1]).getByText("Secundaria")).toBeTruthy();
    expect(within(items[1]).getByLabelText("Davivienda (sin logo)")).toBeTruthy();
  });

  it("al editar precarga los datos reales, el banco y su logo, sin mostrar el número", async () => {
    renderWithProviders(<BankAccountsList />, { routes: routes([BANCOLOMBIA, DAVIVIENDA]) });
    const dialog = await openEdit("Bancolombia", "7890");

    await waitFor(() => expect((bankSelect(dialog) as HTMLSelectElement).value).toBe("k1"));
    expect((within(dialog).getByLabelText(/Tipo de cuenta/) as HTMLSelectElement).value).toBe("savings");
    expect((within(dialog).getByLabelText(/Titular/) as HTMLInputElement).value).toBe("ACME S.A.S");
    expect((within(dialog).getByLabelText(/Documento/) as HTMLInputElement).value).toBe("900123456");
    const number = within(dialog).getByLabelText(/Número de cuenta/) as HTMLInputElement;
    expect(number.value).toBe("");
    expect(number.placeholder).toBe("•••• 7890");
    expect(within(dialog).getByAltText("Logo de Bancolombia")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    const second = await openEdit("Davivienda", "2210");
    await waitFor(() => expect((bankSelect(second) as HTMLSelectElement).value).toBe("k2"));
    expect(within(second).getByLabelText(/Cuenta principal/)).toBeTruthy();
  });

  it("guardar envía solo lo que cambió y conserva el número si se deja vacío", async () => {
    let list: unknown[] = [BANCOLOMBIA];
    const { http } = renderWithProviders(<BankAccountsList />, {
      routes: routes(() => list, {
        "PATCH /company/bank-accounts/:id": () => {
          list = [{ ...BANCOLOMBIA, bankId: "k2", bankName: "Davivienda", bankLogoUrl: null }];
          return list[0];
        },
      }),
    });
    const dialog = await openEdit("Bancolombia", "7890");
    await waitFor(() => expect((bankSelect(dialog) as HTMLSelectElement).value).toBe("k1"));

    fireEvent.change(bankSelect(dialog), { target: { value: "k2" } });
    expect(within(dialog).getByLabelText("Davivienda (sin logo)")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar cuenta" }));

    await waitFor(() => expect(http.calls("PATCH /company/bank-accounts/:id")).toHaveLength(1));
    const patch = http.calls("PATCH /company/bank-accounts/:id")[0];
    expect(patch.url).toBe("/company/bank-accounts/b1");
    expect(patch.body).toEqual({ bankId: "k2" });
    expect(await screen.findByText("Davivienda")).toBeTruthy();
  });

  it("un número nuevo se valida y se envía", async () => {
    const { http } = renderWithProviders(<BankAccountsList />, {
      routes: routes([BANCOLOMBIA], { "PATCH /company/bank-accounts/:id": BANCOLOMBIA }),
    });
    const dialog = await openEdit("Bancolombia", "7890");
    const number = within(dialog).getByLabelText(/Número de cuenta/);

    fireEvent.change(number, { target: { value: "12ab" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar cuenta" }));
    expect(await within(dialog).findByText("El número debe tener solo dígitos (entre 4 y 40).")).toBeTruthy();
    expect(http.calls("PATCH /company/bank-accounts/:id")).toHaveLength(0);

    fireEvent.change(number, { target: { value: "9988 7766" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar cuenta" }));
    await waitFor(() => expect(http.calls("PATCH /company/bank-accounts/:id")[0]?.body).toEqual({ accountNumber: "99887766" }));
  });

  it("crear exige banco, número, titular y documento; luego envía la cuenta con el banco del catálogo", async () => {
    let accounts: unknown[] = [];
    const { http } = renderWithProviders(<BankAccountsList />, {
      routes: routes(() => accounts, {
        "POST /company/bank-accounts": () => {
          accounts = [BANCOLOMBIA];
          return BANCOLOMBIA;
        },
      }),
    });
    expect(await screen.findByText("Aún no tienes cuentas bancarias")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Agregar cuenta bancaria/ }));
    const dialog = await screen.findByRole("dialog", { name: "Nueva cuenta bancaria" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar cuenta" }));
    expect(within(dialog).getByText("Selecciona el banco.")).toBeTruthy();
    expect(within(dialog).getByText("Escribe el titular de la cuenta.")).toBeTruthy();
    expect(within(dialog).queryByLabelText(/Cuenta principal/)).toBeNull();

    await within(dialog).findByRole("option", { name: "Bancolombia" });
    fireEvent.change(bankSelect(dialog), { target: { value: "k1" } });
    expect(within(dialog).getByAltText("Logo de Bancolombia")).toBeTruthy();
    fireEvent.change(within(dialog).getByLabelText(/Tipo de cuenta/), { target: { value: "checking" } });
    fireEvent.change(within(dialog).getByLabelText(/Número de cuenta/), { target: { value: "1234567890" } });
    fireEvent.change(within(dialog).getByLabelText(/Titular/), { target: { value: " ACME S.A.S " } });
    fireEvent.change(within(dialog).getByLabelText(/Documento/), { target: { value: "900123456" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar cuenta" }));

    expect(await screen.findByText("Cuenta bancaria guardada.")).toBeTruthy();
    expect(http.calls("POST /company/bank-accounts")[0].body).toEqual({
      accountHolder: "ACME S.A.S",
      documentNumber: "900123456",
      bankId: "k1",
      accountType: "checking",
      accountNumber: "1234567890",
      isDefault: false,
    });
  });

  it("cuenta anterior al catálogo: muestra su nombre y pide elegir un banco para enlazarla", async () => {
    renderWithProviders(<BankAccountsList />, { routes: routes([LEGACY]) });
    expect(await screen.findByText("Banco Antiguo")).toBeTruthy();
    const dialog = await openEdit("Banco Antiguo", "1111");

    expect(within(dialog).getByText(/Registrada como «Banco Antiguo»/)).toBeTruthy();
    expect((bankSelect(dialog) as HTMLSelectElement).value).toBe("");
  });

  it("hacer principal una secundaria", async () => {
    let list = [BANCOLOMBIA, DAVIVIENDA];
    const { http } = renderWithProviders(<BankAccountsList />, {
      routes: routes(() => list, {
        "PATCH /company/bank-accounts/:id": () => {
          list = [{ ...BANCOLOMBIA, isDefault: false }, { ...DAVIVIENDA, isDefault: true }];
          return list[1];
        },
      }),
    });
    fireEvent.click(await screen.findByRole("button", { name: "Hacer principal la cuenta de Davivienda terminada en 2210" }));

    await waitFor(() => expect(http.calls("PATCH /company/bank-accounts/:id")[0]?.body).toEqual({ isDefault: true }));
    expect(await screen.findByText("Davivienda ahora es tu cuenta principal.")).toBeTruthy();
  });

  it("eliminar una cuenta con liquidaciones muestra el motivo de la API", async () => {
    renderWithProviders(<BankAccountsList />, {
      routes: routes([BANCOLOMBIA], {
        "DELETE /company/bank-accounts/:id": apiError(409, "BANK_ACCOUNT_IN_USE", "Esta cuenta ya tiene liquidaciones asociadas."),
      }),
    });
    fireEvent.click(await screen.findByRole("button", { name: "Eliminar la cuenta de Bancolombia terminada en 7890" }));
    const dialog = await screen.findByRole("dialog", { name: "Eliminar cuenta bancaria" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Eliminar cuenta" }));
    expect((await screen.findAllByText("Esta cuenta ya tiene liquidaciones asociadas.")).length).toBeGreaterThan(0);
  });

  it("vista compacta del resumen: sin eliminar y error con reintento", async () => {
    let fail = true;
    renderWithProviders(<BankAccountsList compact />, {
      routes: routes(() => (fail ? reply(500) : [BANCOLOMBIA])),
    });
    expect(await screen.findByText("No se pudieron cargar tus cuentas")).toBeTruthy();
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(await screen.findByText("Bancolombia")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Eliminar la cuenta/ })).toBeNull();
  });

  it("si el catálogo no carga, el formulario lo indica", async () => {
    renderWithProviders(<BankAccountsList />, {
      routes: { "GET /company/bank-accounts": [], "GET /company/bank-accounts/banks": reply(500) },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Agregar cuenta bancaria/ }));
    expect(await screen.findByText("No se pudo cargar el catálogo de bancos.")).toBeTruthy();
  });
});
