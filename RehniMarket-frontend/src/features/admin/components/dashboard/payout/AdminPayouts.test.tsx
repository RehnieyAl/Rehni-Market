// Liquidaciones (propietario): listado por consignar con fecha límite, filtros, paginación, meses por generar,
// detalle, marcar pagada y generar con vista previa.
import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";

import AdminPayouts from "./AdminPayouts";
import { renderWithProviders } from "@/test/renderApp";
import { apiError, reply } from "@/test/http";

const BANK = { bankName: "Bancolombia", accountType: "savings", accountNumber: "123456789", lastFourDigits: "6789" };
const PAYOUT = {
  id: "p1",
  companyId: "e1",
  companyName: "ACME",
  periodStart: "2026-10-01T00:00:00",
  periodEnd: "2026-10-31T00:00:00",
  grossSales: "1000000",
  commissionPercentage: "0.05",
  commissionAmount: "50000",
  netAmount: "950000",
  payoutStatus: "pending",
  bankAccount: BANK,
  rehniCoinMovement: null,
  paidAt: null,
  createdAt: "2026-11-01T10:00:00Z",
  consignmentDeadline: "2026-11-09",
  isOverdue: false,
  isGenerated: true,
};
const PAID = {
  ...PAYOUT,
  id: "p2",
  companyName: null,
  payoutStatus: "paid",
  paidAt: "2026-11-05T10:00:00Z",
  rehniCoinMovement: { amountCop: "950000", rehniCoins: "950", conversionRate: "1000", createdAt: "2026-11-05" },
};
const TO_GENERATE = {
  ...PAYOUT,
  id: null,
  companyId: "e2",
  companyName: "Beta Shop",
  periodStart: "2026-09-01",
  periodEnd: "2026-09-30",
  netAmount: "475000",
  consignmentDeadline: "2026-10-07",
  isOverdue: true,
  isGenerated: false,
  createdAt: null,
};
const COMPANY = { id: "e1", nameCompany: "ACME", CompanyStatus: true };
const PREVIEW = {
  companyId: "e1",
  companyName: "ACME",
  periodStart: "2026-10-01",
  periodEnd: "2026-10-31",
  grossSales: "200000",
  commissionPercentage: "0.05",
  commissionAmount: "10000",
  netAmount: "190000",
  bankAccount: BANK,
};

function page(items: unknown[], extra = {}) {
  return { items, total: items.length, page: 1, limit: 10, total_pages: 1, ...extra };
}

describe("Admin · Liquidaciones", () => {
  it("lista con estado y monto neto; filtrar por estado envía el parámetro", async () => {
    const { http } = renderWithProviders(<AdminPayouts />, {
      routes: {
        "GET /admin/payouts": (req: { params: Record<string, string> }) =>
          req.params.status === "failed" ? page([]) : page([PAYOUT, PAID], { total_pages: 2 }),
      },
    });
    expect(await screen.findByText("ACME")).toBeTruthy();
    for (const column of ["Periodo", "Neto por consignar", "Fecha límite", "Estado", "Acción"]) {
      expect(screen.getByRole("columnheader", { name: column })).toBeTruthy();
    }
    expect(screen.getAllByText("Empresa")).toHaveLength(2);
    expect(screen.getAllByText("$950.000", { exact: false })).toHaveLength(2);
    expect(screen.getAllByText("Octubre 2026")).toHaveLength(2);
    expect(screen.getAllByText(/9 (de )?nov\.? (de )?2026/)).toHaveLength(2);
    expect(screen.getByText("Página 1 de 2")).toBeTruthy();
    expect(screen.getByText("2 registros")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await waitFor(() => expect(http.requests.at(-1)?.params.page).toBe("2"));
    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    await waitFor(() => expect(http.requests.at(-1)?.params.page).toBe("1"));

    fireEvent.click(screen.getByRole("button", { name: "Fallidas" }));
    expect(await screen.findByText("Sin resultados")).toBeTruthy();
    expect(http.requests.at(-1)?.params).toEqual({ page: "1", limit: "10", status: "failed" });
  });

  it("muestra los meses cerrados por generar con su plazo vencido y los genera desde el detalle", async () => {
    const { http } = renderWithProviders(<AdminPayouts />, {
      routes: {
        "GET /admin/payouts": page([TO_GENERATE, PAYOUT]),
        "POST /admin/payouts/generate": PAYOUT,
      },
    });
    const row = (await screen.findByText("Beta Shop")).closest("tr") as HTMLElement;
    expect(within(row).getByText("Por generar")).toBeTruthy();
    expect(within(row).getByText("Vencida")).toBeTruthy();
    expect(within(row).getByText("Pendiente")).toBeTruthy();
    expect(within(row).getByText(/7 (de )?oct\.? (de )?2026/)).toBeTruthy();

    fireEvent.click(within(row).getByRole("button", { name: /Ver detalle/ }));
    const dialog = await screen.findByRole("dialog", { name: "Beta Shop" });
    expect(within(dialog).getByText("Septiembre 2026")).toBeTruthy();
    expect(within(dialog).getByText("Bancolombia")).toBeTruthy();
    expect(http.calls("GET /admin/payouts/:id")).toHaveLength(0);

    fireEvent.click(within(dialog).getByRole("button", { name: "Generar liquidación" }));
    expect(await screen.findByText("Liquidación generada para Beta Shop.")).toBeTruthy();
    expect(http.calls("POST /admin/payouts/generate")[0].body).toEqual({
      companyId: "e2",
      periodStart: "2026-09-01",
      periodEnd: "2026-09-30",
    });
    await waitFor(() => expect(http.calls("GET /admin/payouts").length).toBeGreaterThan(1));
  });

  it("sin cuenta bancaria la obligación sigue pendiente y no se puede generar", async () => {
    renderWithProviders(<AdminPayouts />, {
      routes: { "GET /admin/payouts": page([{ ...TO_GENERATE, bankAccount: null }]) },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Ver detalle/ }));
    const dialog = await screen.findByRole("dialog", { name: "Beta Shop" });
    expect(within(dialog).getByRole("alert").textContent).toMatch(/no tiene una cuenta bancaria predeterminada/);
    expect((within(dialog).getByRole("button", { name: "Generar liquidación" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("sin liquidaciones invita a generar la primera", async () => {
    renderWithProviders(<AdminPayouts />, { routes: { "GET /admin/payouts": page([]) } });
    expect(await screen.findByText("Aún no hay liquidaciones")).toBeTruthy();
  });

  it("el detalle desglosa comisión y cuenta; marcar como pagada confirma y recarga", async () => {
    const { http } = renderWithProviders(<AdminPayouts />, {
      routes: {
        "GET /admin/payouts": page([PAYOUT]),
        "GET /admin/payouts/:id": PAYOUT,
        "PATCH /admin/payouts/:id/pay": { ...PAYOUT, payoutStatus: "paid" },
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Ver detalle/ }));
    expect(await screen.findByText(/Comisión Rehni Market \(\s*5\s*%\)/)).toBeTruthy();
    expect(screen.getByText("-$50.000")).toBeTruthy();
    expect(screen.getByText("Ahorros")).toBeTruthy();
    expect(screen.getAllByText("Pendiente").length).toBeGreaterThan(0);
    expect(screen.getByText("Fecha límite de consignación")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Marcar como pagada/ }));
    const dialog = await screen.findByRole("dialog", { name: "Marcar liquidación como pagada" });
    expect(within(dialog).getByText("123456789")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirmar pago" }));

    expect(await screen.findByText("Liquidación de ACME marcada como pagada.")).toBeTruthy();
    expect(http.calls("PATCH /admin/payouts/:id/pay")[0].url).toBe("/admin/payouts/p1/pay");
    await waitFor(() => expect(http.calls("GET /admin/payouts").length).toBeGreaterThan(1));
  });

  it("una liquidación pagada muestra la conversión RehniCoin y no ofrece pagar", async () => {
    renderWithProviders(<AdminPayouts />, {
      routes: { "GET /admin/payouts": page([PAID]), "GET /admin/payouts/:id": PAID },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Ver detalle/ }));
    expect(await screen.findByText("Conversión RehniCoin")).toBeTruthy();
    expect(screen.getByText("1 RC = $1.000 COP")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Marcar como pagada/ })).toBeNull();
  });

  it("errores del backend al cargar detalle o pagar se muestran", async () => {
    renderWithProviders(<AdminPayouts />, {
      routes: {
        "GET /admin/payouts": page([PAYOUT]),
        "GET /admin/payouts/:id": PAYOUT,
        "PATCH /admin/payouts/:id/pay": apiError(409, "PAYOUT_ALREADY_PAID", "La liquidación ya fue pagada."),
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Ver detalle/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Marcar como pagada/ }));
    fireEvent.click(within(await screen.findByRole("dialog", { name: "Marcar liquidación como pagada" })).getByRole("button", { name: "Confirmar pago" }));
    expect((await screen.findAllByText("La liquidación ya fue pagada.")).length).toBeGreaterThan(0);
  });

  it("si el detalle falla avisa con el mensaje por defecto", async () => {
    renderWithProviders(<AdminPayouts />, {
      routes: { "GET /admin/payouts": page([PAYOUT]), "GET /admin/payouts/:id": reply(500) },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Ver detalle/ }));
    expect(await screen.findByText("No se pudo cargar el detalle de la liquidación.")).toBeTruthy();
  });
});

describe("Admin · Generar liquidación", () => {
  async function openAndPickCompany(routes: Record<string, unknown>) {
    const result = renderWithProviders(<AdminPayouts />, {
      routes: {
        "GET /admin/payouts": page([]),
        "GET /admin/dashboard/get-companies": { items: [COMPANY], next_cursor: null, has_next: false },
        ...routes,
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Generar liquidación/ }));
    fireEvent.change(screen.getByPlaceholderText("Buscar empresa por nombre..."), { target: { value: "acm" } });
    fireEvent.click(await screen.findByRole("button", { name: "ACME" }));
    return result;
  }

  it("busca empresa, elige mes, muestra vista previa y genera", async () => {
    const { http } = await openAndPickCompany({
      "GET /admin/payouts/available-periods": [{ periodStart: "2026-10-01", periodEnd: "2026-10-31" }],
      "GET /admin/payouts/preview": PREVIEW,
      "POST /admin/payouts/generate": PAYOUT,
    });
    expect(http.calls("GET /admin/dashboard/get-companies")[0].params).toEqual({ limit: "8", search: "acm" });

    const select = await screen.findByRole("combobox");
    expect(screen.getByRole("option", { name: "Octubre 2026" })).toBeTruthy();
    fireEvent.change(select, { target: { value: "2026-10-01" } });

    expect(await screen.findByText("Vista previa lista para generar")).toBeTruthy();
    expect(screen.getByText("-$10.000")).toBeTruthy();
    expect(http.calls("GET /admin/payouts/preview")[0].params).toEqual({
      company_id: "e1",
      period_start: "2026-10-01",
      period_end: "2026-10-31",
    });

    const buttons = screen.getAllByRole("button", { name: "Generar liquidación" });
    fireEvent.click(buttons[buttons.length - 1]);
    expect(await screen.findByText("Liquidación generada para ACME.")).toBeTruthy();
    expect(http.calls("POST /admin/payouts/generate")[0].body).toEqual({
      companyId: "e1",
      periodStart: "2026-10-01",
      periodEnd: "2026-10-31",
    });
  });

  it("sin periodos pendientes lo explica; 'Cambiar' vuelve a la búsqueda", async () => {
    await openAndPickCompany({ "GET /admin/payouts/available-periods": [] });
    expect(await screen.findByText(/no tiene periodos pendientes de liquidar/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cambiar" }));
    expect(screen.getByPlaceholderText("Buscar empresa por nombre...")).toBeTruthy();
  });

  it("error en la vista previa muestra el motivo del backend", async () => {
    await openAndPickCompany({
      "GET /admin/payouts/available-periods": [{ periodStart: "2026-09-01", periodEnd: "2026-09-30" }],
      "GET /admin/payouts/preview": apiError(400, "NO_BANK_ACCOUNT", "La empresa no tiene cuenta bancaria."),
    });
    fireEvent.change(await screen.findByRole("combobox"), { target: { value: "2026-09-01" } });
    expect((await screen.findAllByText("La empresa no tiene cuenta bancaria.")).length).toBeGreaterThan(0);
  });

  it("búsqueda sin resultados y cancelar", async () => {
    renderWithProviders(<AdminPayouts />, {
      routes: {
        "GET /admin/payouts": page([]),
        "GET /admin/dashboard/get-companies": { items: [], next_cursor: null, has_next: false },
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Generar liquidación/ }));
    fireEvent.change(screen.getByPlaceholderText("Buscar empresa por nombre..."), { target: { value: "zzz" } });
    expect(await screen.findByText("Sin resultados.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByPlaceholderText("Buscar empresa por nombre...")).toBeNull());
  });
});
