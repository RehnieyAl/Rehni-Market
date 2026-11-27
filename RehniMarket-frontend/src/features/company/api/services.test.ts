// Contrato HTTP de los servicios del panel de empresa con RehniMarket-backend.
import { describe, expect, it } from "vitest";

import * as bank from "./bankAccountService";
import * as catalog from "./catalogService";
import * as company from "./companyService";
import * as orders from "./orderService";
import * as payouts from "./payoutService";
import * as products from "./productService";
import * as returns from "./returnService";
import * as variants from "./variantService";
import { formDataToObject, makeFile, mockApi } from "@/test/http";

type Case = [string, () => Promise<unknown>, string, string, { params?: object; body?: unknown }?];

const BANK = {
  accountHolder: "ACME",
  documentNumber: "900123456",
  bankId: "k1",
  accountType: "SAVINGS" as never,
  accountNumber: "123",
};

const CASES: Case[] = [
  ["resumen inicio", () => company.getCompanyHero(), "GET", "/company/dashboard/me"],
  ["resumen productos", () => company.getProductsSummary(), "GET", "/company/dashboard/products-summary"],
  ["mi perfil", () => company.getMyCompanyProfile(), "GET", "/company/dashboard/my-profile"],
  ["actualizar perfil", () => company.updateMyCompanyProfile({ addressCompany: "Calle 2" } as never), "PATCH",
    "/company/dashboard/upgrade-my-profile", { body: { addressCompany: "Calle 2" } }],

  ["catálogos públicos", () => catalog.getCatalogs(), "GET", "/public/catalogs"],
  ["atributos de catálogo", () => catalog.getCatalogAttributes("k1"), "GET", "/public/catalogs/k1/attributes"],

  ["cuentas bancarias", () => bank.getBankAccounts(), "GET", "/company/bank-accounts"],
  ["crear cuenta", () => bank.createBankAccount(BANK), "POST", "/company/bank-accounts", { body: BANK }],
  ["editar cuenta", () => bank.updateBankAccount("b1", { isDefault: true }), "PATCH", "/company/bank-accounts/b1",
    { body: { isDefault: true } }],
  ["borrar cuenta", () => bank.deleteBankAccount("b1"), "DELETE", "/company/bank-accounts/b1"],
  ["bancos disponibles", () => bank.getAvailableBanks(), "GET", "/company/bank-accounts/banks"],

  ["liquidaciones", () => payouts.getCompanyPayouts(), "GET", "/company/payouts", { params: { page: "1", limit: "10" } }],
  ["detalle liquidación", () => payouts.getCompanyPayoutDetail("p1"), "GET", "/company/payouts/p1"],
  ["saldo empresa", () => payouts.getCompanyBalance(), "GET", "/company/balance"],

  ["pedidos con estados repetidos y búsqueda", () => orders.getCompanyOrders(2, 5, ["PAID", "SHIPPED"], "ana"), "GET",
    "/company/dashboard/orders", { params: { page: "2", limit: "5", status: ["PAID", "SHIPPED"], search: "ana" } }],
  ["pedidos sin filtros", () => orders.getCompanyOrders(), "GET", "/company/dashboard/orders",
    { params: { page: "1", limit: "10" } }],
  ["conteo por estado", () => orders.getCompanyOrderStatusCounts(), "GET", "/company/dashboard/orders/status-counts"],
  ["detalle pedido", () => orders.getCompanyOrderDetail("o1"), "GET", "/company/dashboard/orders/o1"],
  ["cambiar estado", () => orders.updateCompanyOrderStatus("o1", "PROCESSING"), "PATCH",
    "/company/dashboard/orders/o1/status", { body: { status: "PROCESSING" } }],
  ["transportadoras activas", () => orders.getActiveShippingCarriers(), "GET", "/company/dashboard/shipping-carriers"],
  ["datos de envío", () => orders.updateCompanyOrderShipping("o1", "s1", "G-1"), "PATCH",
    "/company/dashboard/orders/o1/shipping", { body: { shippingCarrierId: "s1", trackingNumber: "G-1" } }],

  ["devoluciones 'all' y búsqueda en blanco se omiten", () => returns.getCompanyReturns({ status: "all", search: "  " }),
    "GET", "/company/dashboard/returns", { params: { page: "1", limit: "10" } }],
  ["devoluciones filtradas", () => returns.getCompanyReturns({ page: 2, status: "PENDING" as never, search: " ana " }),
    "GET", "/company/dashboard/returns", { params: { page: "2", limit: "10", status: "PENDING", search: "ana" } }],
  ["detalle devolución", () => returns.getCompanyReturnDetail("r1"), "GET", "/company/dashboard/returns/r1"],
  ["decidir devolución", () => returns.decideCompanyReturn("r1", { action: "reject" as never, reason: "uso" }), "PATCH",
    "/company/dashboard/returns/r1", { body: { action: "reject", reason: "uso" } }],

  ["mis productos", () => products.getMyProducts(1, 10, "silla"), "GET", "/company/dashboard/get-my-products",
    { params: { page: "1", limit: "10", search: "silla" } }],
  ["estado producto", () => products.changeProductStatus("p1", { is_active: false } as never), "PATCH",
    "/company/dashboard/change-status-my-product/p1", { body: { is_active: false } }],
  ["borrar producto", () => products.deleteMyProduct("p1"), "DELETE", "/company/dashboard/delete-my-product/p1"],
  ["detalle producto", () => products.getProductDetail("p1"), "GET", "/company/dashboard/get-my-product/p1"],

  ["variantes con borradas", () => variants.getProductVariants("p1", true), "GET", "/company/dashboard/products/p1/variants",
    { params: { include_deleted: "true" } }],
  ["detalle variante", () => variants.getVariantDetail("p1", "v1"), "GET", "/company/dashboard/products/p1/variants/v1"],
  ["crear variante", () => variants.createVariant("p1", { sku: "S-1" } as never), "POST",
    "/company/dashboard/products/p1/variants", { body: { sku: "S-1" } }],
  ["editar variante", () => variants.updateVariant("p1", "v1", { stock: 3 } as never), "PATCH",
    "/company/dashboard/products/p1/variants/v1", { body: { stock: 3 } }],
  ["borrar variante", () => variants.deleteVariant("p1", "v1"), "DELETE", "/company/dashboard/products/p1/variants/v1"],
  ["generar combinaciones", () => variants.generateCombinations("p1", ["a1", "a2"]), "POST",
    "/company/dashboard/products/p1/variants/generate", { body: { attribute_ids: ["a1", "a2"] } }],
  ["valores de atributos en snake_case", () => variants.setVariantAttributeValues("p1", "v1", [{ attributeId: "a1", value: "Rojo" }]),
    "PUT", "/company/dashboard/products/p1/variants/v1/attribute-values", { body: [{ attribute_id: "a1", value: "Rojo" }] }],
  ["borrar imagen", () => variants.deleteVariantImage("p1", "v1", "i1"), "DELETE",
    "/company/dashboard/products/p1/variants/v1/images/i1"],
  ["imagen principal", () => variants.setMainVariantImage("p1", "v1", "i1"), "PATCH",
    "/company/dashboard/products/p1/variants/v1/images/i1/main"],
];

describe("servicios empresa · contrato HTTP", () => {
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

describe("servicios empresa · multipart", () => {
  it("crear producto: identidad sin precio ni stock propios y atributos vacíos descartados", async () => {
    const http = mockApi({ "POST /company/dashboard/create-product": { product_id: "p1" } });
    await products.createProduct({
      nameProduct: "Silla",
      catalogId: "k1",
      descripcionProduct: "Madera",
      appliesTax: true,
      productAttributes: [
        { attributeId: "a1", value: "  Roble " },
        { attributeId: "a2", value: "   " },
      ],
    } as never);
    expect(formDataToObject(http.requests[0].body)).toEqual({
      nameProduct: "Silla",
      catalogId: "k1",
      descripcionProduct: "Madera",
      technicalSpecProduct: JSON.stringify([{ attributeId: "a1", value: "Roble" }]),
      appliesTax: "true",
      priceProduct: "0",
      stockProduct: "0",
    });
  });

  it("editar producto envía solo los campos definidos", async () => {
    const http = mockApi({ "PATCH /company/dashboard/update-my-product/:id": {} });
    await products.updateProduct("p1", {
      nameProduct: "Silla 2",
      catalogId: "k2",
      descripcionProduct: "Nueva",
      appliesTax: false,
      productAttributes: [],
    } as never);
    expect(formDataToObject(http.requests[0].body)).toEqual({
      nameProduct: "Silla 2",
      catalogId: "k2",
      descripcionProduct: "Nueva",
      appliesTax: "false",
      technicalSpecProduct: "[]",
    });

    await products.updateProduct("p1", {} as never);
    expect(formDataToObject(http.requests[1].body)).toEqual({});
  });

  it("subir imágenes de variante repite el campo por archivo", async () => {
    const http = mockApi({ "POST /company/dashboard/products/:p/variants/:v/images": {} });
    const a = makeFile("a.png", "image/png");
    const b = makeFile("b.webp", "image/webp");
    await variants.uploadVariantImages("p1", "v1", [a, b]);
    expect(formDataToObject(http.requests[0].body)).toEqual({ imagesVariant: [a, b] });
  });

  it("logo y banner se envían solo si vienen", async () => {
    const http = mockApi({ "PATCH /company/dashboard/patch-media-logo-banner": {} });
    const logo = makeFile("l.png", "image/png");
    await company.patchMediaLogoBanner({ photo_profile: logo } as never);
    expect(formDataToObject(http.requests[0].body)).toEqual({ photo_profile: logo });

    const banner = makeFile("b.jpg", "image/jpeg");
    await company.patchMediaLogoBanner({ banner_profile: banner } as never);
    expect(formDataToObject(http.requests[1].body)).toEqual({ banner_profile: banner });
  });
});
