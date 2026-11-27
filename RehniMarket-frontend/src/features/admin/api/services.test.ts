// Contrato HTTP de los servicios del panel admin con RehniMarket-backend.
import { describe, expect, it } from "vitest";

import * as ads from "./advertisementService";
import * as attrs from "./catalogAttributeService";
import * as banks from "./bankService";
import * as catalogs from "./catalogService";
import * as companies from "./companyService";
import * as dashboard from "./dashboardService";
import * as payouts from "./payoutService";
import * as carriers from "./shippingCarrierService";
import * as users from "./userService";
import * as wallet from "./walletService";
import { formDataToObject, makeFile, mockApi } from "@/test/http";

type Case = [string, () => Promise<unknown>, string, string, { params?: object; body?: unknown }?];

const CASES: Case[] = [
  ["bancos", () => banks.getAdminBanks(), "GET", "/admin/dashboard/banks"],
  ["estadísticas", () => dashboard.getAdminDashboardStatistics(), "GET", "/admin/dashboard/statistics"],
  ["actividad reciente", () => dashboard.getRecentAdminActivities(), "GET", "/admin/dashboard/recent-activities"],
  ["usuarios recientes", () => dashboard.getRecentAdminUsers(), "GET", "/admin/dashboard/recent-users"],

  ["usuarios con búsqueda vacía", () => users.getAdminUsers(), "GET", "/admin/dashboard/get-users", { params: { limit: "10" } }],
  ["usuarios con cursores", () => users.getAdminUsers(5, "c", "b", "ana"), "GET", "/admin/dashboard/get-users",
    { params: { limit: "5", cursor: "c", before_cursor: "b", search: "ana" } }],
  ["detalle usuario", () => users.getAdminUserById("u1"), "GET", "/admin/dashboard/get-user/u1"],
  ["editar usuario", () => users.updateAdminUser("u1", { email: "a@b.co" }), "PATCH",
    "/admin/dashboard/user/update-information/u1", { body: { email: "a@b.co" } }],
  ["bloquear usuario", () => users.toggleAdminUserStatus("u1"), "PATCH", "/admin/dashboard/user/update-information/status/u1"],

  ["empresas 'all' omite el estado", () => companies.getAdminCompanies(10, undefined, "acme"), "GET",
    "/admin/dashboard/get-companies", { params: { limit: "10", search: "acme" } }],
  ["empresas por estado", () => companies.getAdminCompanies(10, "c1", undefined, "pending"), "GET",
    "/admin/dashboard/get-companies", { params: { limit: "10", cursor: "c1", status: "pending" } }],
  ["detalle empresa", () => companies.getAdminCompany("e1"), "GET", "/admin/dashboard/get-company/e1"],
  ["aprobar certificado no envía motivo", () => companies.updateCertificateStatus("e1", "approved", "ignorado"), "PATCH",
    "/admin/dashboard/companies/certificate/status/e1", { body: { status: "approved" } }],
  ["rechazar certificado exige motivo", () => companies.updateCertificateStatus("e1", "rejected", "ilegible"), "PATCH",
    "/admin/dashboard/companies/certificate/status/e1", { body: { status: "rejected", reason: "ilegible" } }],
  ["suspender empresa", () => companies.updateCompanyStatus("e1", false, "fraude"), "PATCH",
    "/admin/dashboard/company/status/e1", { body: { status: false, reason: "fraude" } }],

  ["catálogos", () => catalogs.getAdminCatalogs(), "GET", "/admin/dashboard/get-catalogs"],
  ["estado catálogo", () => catalogs.changeAdminCatalogStatus("k1", false), "PATCH",
    "/admin/dashboard/change-status-catalog/k1", { body: { is_active: false } }],
  ["borrar catálogo", () => catalogs.deleteAdminCatalog("k1"), "DELETE", "/admin/dashboard/delete-catalogs/k1"],

  ["atributos de catálogo", () => attrs.getCatalogAttributes("k1"), "GET", "/admin/dashboard/catalogs/k1/catalog-attributes"],
  ["crear atributo", () => attrs.createCatalogAttribute("k1", { name: "Talla" } as never), "POST",
    "/admin/dashboard/catalogs/k1/catalog-attributes", { body: { name: "Talla" } }],
  ["editar atributo", () => attrs.updateCatalogAttribute("a1", { name: "Color" } as never), "PATCH",
    "/admin/dashboard/catalog-attributes/a1", { body: { name: "Color" } }],
  ["estado atributo", () => attrs.setCatalogAttributeStatus("a1", true), "PATCH",
    "/admin/dashboard/catalog-attributes/a1/status", { body: { is_active: true } }],
  ["borrar atributo", () => attrs.deleteCatalogAttribute("a1"), "DELETE", "/admin/dashboard/catalog-attributes/a1"],
  ["agregar opción", () => attrs.addAttributeOption("a1", { value: "M" } as never), "POST",
    "/admin/dashboard/catalog-attributes/a1/options", { body: { value: "M" } }],
  ["editar opción", () => attrs.updateAttributeOption("o1", { value: "L" } as never), "PATCH",
    "/admin/dashboard/catalog-attribute-options/o1", { body: { value: "L" } }],
  ["borrar opción", () => attrs.deleteAttributeOption("o1"), "DELETE", "/admin/dashboard/catalog-attribute-options/o1"],

  ["anuncios", () => ads.getAdminAdvertisements(), "GET", "/admin/dashboard/get-advertisements"],
  ["estado anuncio", () => ads.changeAdminAdvertisementStatus("ad1", true), "PATCH",
    "/admin/dashboard/change-status-advertisement/ad1", { body: { is_active: true } }],
  ["borrar anuncio", () => ads.deleteAdminAdvertisement("ad1"), "DELETE", "/admin/dashboard/delete-advertisement/ad1"],

  ["transportadoras", () => carriers.getShippingCarriers(), "GET", "/admin/dashboard/shipping-carriers"],
  ["crear transportadora", () => carriers.createShippingCarrier({ name: "Envia", tracking_url: "https://t/{guia}", is_active: true }),
    "POST", "/admin/dashboard/shipping-carriers", { body: { name: "Envia", tracking_url: "https://t/{guia}", is_active: true } }],
  ["editar transportadora", () => carriers.updateShippingCarrier("s1", { name: "X", tracking_url: "u", is_active: false }),
    "PUT", "/admin/dashboard/shipping-carriers/s1", { body: { name: "X", tracking_url: "u", is_active: false } }],
  ["estado transportadora", () => carriers.changeShippingCarrierStatus("s1", false), "PATCH",
    "/admin/dashboard/shipping-carriers/s1/status", { body: { is_active: false } }],

  ["liquidaciones", () => payouts.getAdminPayouts(2, 5, "PENDING" as never), "GET", "/admin/payouts",
    { params: { page: "2", limit: "5", status: "PENDING" } }],
  ["detalle liquidación", () => payouts.getAdminPayoutDetail("p1"), "GET", "/admin/payouts/p1"],
  ["generar liquidación", () => payouts.generatePayout({ companyId: "e1", periodStart: "2026-10-01", periodEnd: "2026-10-31" }),
    "POST", "/admin/payouts/generate", { body: { companyId: "e1", periodStart: "2026-10-01", periodEnd: "2026-10-31" } }],
  ["periodos disponibles", () => payouts.getAvailablePayoutPeriods("e1"), "GET", "/admin/payouts/available-periods",
    { params: { company_id: "e1" } }],
  ["vista previa", () => payouts.getPayoutPreview("e1", "a", "b"), "GET", "/admin/payouts/preview",
    { params: { company_id: "e1", period_start: "a", period_end: "b" } }],
  ["marcar pagada", () => payouts.markPayoutPaid("p1"), "PATCH", "/admin/payouts/p1/pay"],

  ["recargar por correo", () => wallet.rechargeWalletByEmail("a@b.co", 5000, "bono"), "POST", "/admin/wallet/recharge",
    { body: { email: "a@b.co", amount: 5000, description: "bono" } }],
  ["historial de recargas", () => wallet.getRechargeHistory(), "GET", "/admin/wallet/history", { params: { page: "1", limit: "10" } }],
  ["corregir recarga", () => wallet.correctRecharge("t1", 100, "error"), "POST", "/admin/wallet/recharge/t1/correction",
    { body: { newAmount: 100, reason: "error" } }],
];

describe("servicios admin · contrato HTTP", () => {
  it.each(CASES)("%s", async (_name, call, method, url, expected = {}) => {
    const http = mockApi({ [`${method} ${url}`]: { ok: true } });
    await call();
    const [req] = http.requests;
    expect(req.method).toBe(method);
    expect(req.url).toBe(url);
    if (expected.params) expect(req.params).toEqual(expected.params);
    if (expected.body !== undefined) expect(req.body).toEqual(expected.body);
  });
});

describe("servicios admin · multipart", () => {
  it("crear catálogo envía solo los campos presentes y la imagen", async () => {
    const http = mockApi({ "POST /admin/dashboard/created-catalogs": {} });
    const image = makeFile("c.png", "image/png");
    await catalogs.createAdminCatalog({ name: "Ropa", display_order: 2, is_active: true, image } as never);
    expect(formDataToObject(http.requests[0].body)).toEqual({
      name: "Ropa",
      display_order: "2",
      is_active: "true",
      image,
    });
  });

  it("editar catálogo puede pedir quitar la imagen", async () => {
    const http = mockApi({ "PUT /admin/dashboard/update-catalogs/:id": {} });
    await catalogs.updateAdminCatalog("k1", { description: "", remove_image: true } as never);
    expect(http.requests[0].url).toBe("/admin/dashboard/update-catalogs/k1");
    expect(formDataToObject(http.requests[0].body)).toEqual({ description: "", remove_image: "true" });
  });

  it("crear anuncio incluye imágenes y segmentación", async () => {
    const http = mockApi({ "POST /admin/dashboard/create-advertisement": {} });
    const image = makeFile("d.webp", "image/webp");
    const mobile = makeFile("m.jpg", "image/jpeg");
    await ads.createAdminAdvertisement({
      button_link: "/offers",
      order: 1,
      is_active: true,
      image,
      mobile_image: mobile,
      target_type: "PROMOTION",
      minimum_discount: 20,
      maximum_stock: 5,
      max_age_days: 7,
    } as never);
    expect(formDataToObject(http.requests[0].body)).toEqual({
      button_link: "/offers",
      order: "1",
      is_active: "true",
      image,
      mobile_image: mobile,
      target_type: "PROMOTION",
      minimum_discount: "20",
      maximum_stock: "5",
      max_age_days: "7",
    });
  });

  it("editar anuncio envía solo lo cambiado (quitar imagen móvil y destino)", async () => {
    const http = mockApi({ "PATCH /admin/dashboard/update-advertisement/:id": {} });
    await ads.updateAdminAdvertisement("ad1", {
      order: 3,
      remove_mobile_image: true,
      clear_target: true,
      target_product_id: "p1",
      target_catalog_id: "k1",
      target_company_id: "e1",
    } as never);
    expect(formDataToObject(http.requests[0].body)).toEqual({
      order: "3",
      remove_mobile_image: "true",
      clear_target: "true",
      target_product_id: "p1",
      target_catalog_id: "k1",
      target_company_id: "e1",
    });
  });
});

describe("Servicio de bancos · formularios multipart", () => {
  it("registra con nombre, estado y logo, y edita solo los campos enviados", async () => {
    const http = mockApi({ "POST /admin/dashboard/banks": {}, "PATCH /admin/dashboard/banks/:id": {} });
    const logo = makeFile("logo.png", "image/png");

    await banks.createBank({ name: "Bancolombia", isActive: true, logo });
    await banks.updateBank("k1", { isActive: false });

    expect(formDataToObject(http.calls("POST /admin/dashboard/banks")[0].body)).toEqual({
      name: "Bancolombia",
      is_active: "true",
      logo,
    });
    expect(http.calls("PATCH /admin/dashboard/banks/:id")[0].url).toBe("/admin/dashboard/banks/k1");
    expect(formDataToObject(http.calls("PATCH /admin/dashboard/banks/:id")[0].body)).toEqual({ is_active: "false" });
  });
});
