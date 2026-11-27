// Contrato HTTP de los servicios públicos y del comprador con RehniMarket-backend.
import { describe, expect, it } from "vitest";

import * as addresses from "@/features/addresses/api/addressService";
import * as cart from "@/features/cart/api/cartService";
import { checkout } from "@/features/cart/api/checkoutService";
import * as favorites from "@/features/favorites/api/favoriteService";
import * as orders from "@/features/orders/api/orderService";
import * as auth from "@/features/public/auth/api/authService";
import { updateCompanyCertificate } from "@/features/public/auth/api/certificateService";
import * as publicCompany from "@/features/public/company/api/companyService";
import * as home from "@/features/public/home/api/homeService";
import * as products from "@/features/public/products/api/productsService";
import * as reviews from "@/features/public/reviews/api/reviewService";
import * as reports from "@/features/reports/api/reportService";
import * as returns from "@/features/returns/api/returnService";
import * as wallet from "@/features/wallet/api/walletService";
import { formDataToObject, makeFile, mockApi } from "@/test/http";

type Case = [string, () => Promise<unknown>, string, string, { params?: object; body?: unknown }?];

const CASES: Case[] = [
  ["registro comprador", () => auth.registerUser({ email: "a@b.co" } as never), "POST", "/auth/register-user", { body: { email: "a@b.co" } }],
  ["verificar correo", () => auth.verifyEmail({ email: "a@b.co", code: "123456" } as never), "POST", "/auth/verify-email-user",
    { body: { email: "a@b.co", code: "123456" } }],
  ["cambiar correo", () => auth.changeEmail({ email: "x" } as never), "POST", "/auth/change-email", { body: { email: "x" } }],
  ["reenviar código", () => auth.resendVerificationCode({ email: "a@b.co" } as never), "POST", "/auth/resend-verification-code",
    { body: { email: "a@b.co" } }],
  ["login", () => auth.loginUser({ email: "a@b.co", password: "x" }), "POST", "/auth/login-user", { body: { email: "a@b.co", password: "x" } }],
  ["olvidé contraseña", () => auth.forgotPassword({ email: "a@b.co" } as never), "POST", "/auth/forgot-password-user"],
  ["restablecer contraseña", () => auth.resetPassword({ token: "t", password: "p" } as never), "POST", "/auth/reset-password-user",
    { body: { token: "t", password: "p" } }],
  ["perfil", () => auth.getProfile(), "GET", "/auth/me"],
  ["actualizar perfil", () => auth.updateMe({ name: "Ana" } as never), "PATCH", "/auth/me", { body: { name: "Ana" } }],

  ["perfil público empresa", () => publicCompany.getPublicCompanyProfile("e1"), "GET", "/public/company/e1"],
  ["calificación empresa", () => publicCompany.getCompanyRating("e1"), "GET", "/public/company/e1/rating"],
  ["productos de empresa", () => publicCompany.getPublicCompanyProducts("e1", 2), "GET", "/public/company/e1/products",
    { params: { page: "2", limit: "12" } }],

  ["anuncios activos", () => home.getActiveAdvertisements(), "GET", "/public/advertisements"],
  ["productos del día", () => home.getDailyProducts(), "GET", "/public/products/daily", { params: { limit: "8" } }],

  ["detalle producto", () => products.getPublicProductDetail("p1"), "GET", "/public/products/p1"],
  ["atributos catálogo", () => products.getCatalogAttributes("k1"), "GET", "/public/catalogs/k1/attributes"],
  ["catálogos", () => products.getCatalogs(), "GET", "/public/catalogs"],
  ["productos sin filtros", () => products.getPublicProducts(), "GET", "/public/products", { params: { page: "1", limit: "24" } }],
  ["productos con todos los filtros", () => products.getPublicProducts({
    search: "silla", catalogId: "k1", minPrice: 0, maxPrice: 900, discount: true, inStock: true,
    minDiscount: 10, maxStock: 5, days: 7, sort: "price_asc" as never, page: 3, limit: 12,
  }), "GET", "/public/products", { params: {
    search: "silla", catalog_id: "k1", min_price: "0", max_price: "900", discount: "true", in_stock: "true",
    min_discount: "10", max_stock: "5", days: "7", sort: "price_asc", page: "3", limit: "12",
  } }],
  ["ofertas", () => products.getPublicOffers(), "GET", "/public/products/offers", { params: { page: "1", limit: "24" } }],
  ["novedades", () => products.getPublicNewProducts(2, 6), "GET", "/public/products/new", { params: { page: "2", limit: "6" } }],

  ["reseñas", () => reviews.getProductReviews("p1"), "GET", "/public/products/p1/reviews", { params: { page: "1", limit: "10" } }],
  ["elegibilidad reseña", () => reviews.getReviewEligibility("p1"), "GET", "/reviews/eligibility/p1"],
  ["crear reseña", () => reviews.createReview("p1", 5, "Bueno"), "POST", "/reviews", { body: { productId: "p1", rating: 5, comment: "Bueno" } }],
  ["borrar reseña", () => reviews.deleteReview("r1"), "DELETE", "/reviews/r1"],

  ["carrito", () => cart.getCart(), "GET", "/cart"],
  ["agregar al carrito", () => cart.addToCart({ productId: "p1", quantity: 2, variantId: "v1" }), "POST", "/cart/add",
    { body: { productId: "p1", quantity: 2, variantId: "v1" } }],
  ["cambiar cantidad", () => cart.updateCartItem("i1", { quantity: 3 }), "PATCH", "/cart/item/i1", { body: { quantity: 3 } }],
  ["quitar ítem", () => cart.removeCartItem("i1"), "DELETE", "/cart/item/i1"],
  ["vaciar carrito", () => cart.clearCart(), "DELETE", "/cart/clear"],
  ["checkout", () => checkout({ addressId: "d1" } as never), "POST", "/checkout", { body: { addressId: "d1" } }],

  ["favoritos", () => favorites.getFavorites(), "GET", "/favorites"],
  ["agregar favorito", () => favorites.addFavorite("p1"), "POST", "/favorites", { body: { productId: "p1" } }],
  ["quitar favorito", () => favorites.removeFavorite("p1"), "DELETE", "/favorites/p1"],

  ["direcciones", () => addresses.getAddresses(), "GET", "/addresses"],
  ["crear dirección", () => addresses.createAddress({ city: "Cali" } as never), "POST", "/addresses", { body: { city: "Cali" } }],
  ["editar dirección", () => addresses.updateAddress("d1", { city: "Bogotá" } as never), "PATCH", "/addresses/d1", { body: { city: "Bogotá" } }],
  ["borrar dirección", () => addresses.deleteAddress("d1"), "DELETE", "/addresses/d1"],
  ["dirección principal", () => addresses.setDefaultAddress("d1"), "PATCH", "/addresses/d1/set-default"],

  ["mis pedidos", () => orders.getMyOrders(), "GET", "/orders", { params: { page: "1", limit: "10" } }],
  ["detalle pedido", () => orders.getMyOrderDetail("o1"), "GET", "/orders/o1"],
  ["cancelar pedido", () => orders.cancelMyOrder("o1"), "PATCH", "/orders/o1/cancel"],
  ["mis devoluciones", () => returns.getMyReturns(), "GET", "/returns", { params: { page: "1", limit: "10" } }],
  ["detalle de devolución", () => returns.getMyReturnDetail("r1"), "GET", "/returns/r1"],
  ["solicitar revisión", () => returns.requestReturnReview("r1", "No estoy de acuerdo"), "POST", "/returns/r1/review",
    { body: { reason: "No estoy de acuerdo" } }],
  ["solicitar devolución", () => returns.requestReturn("o1", { orderItemId: "i1", reason: "Llegó roto" }), "POST", "/orders/o1/returns",
    { body: { orderItemId: "i1", reason: "Llegó roto" } }],

  ["billetera", () => wallet.getMyWallet(), "GET", "/wallet/me"],
  ["movimientos", () => wallet.getMyTransactions(2), "GET", "/wallet/transactions", { params: { page: "2", limit: "10" } }],
  ["recarga", () => wallet.rechargeWallet("u1", 1000, "x"), "POST", "/wallet/recharge", { body: { userId: "u1", amount: 1000, description: "x" } }],

  ["reportes admin 'all' se omite", () => reports.getAdminReports(), "GET", "/admin/reports", { params: { page: "1", limit: "10" } }],
  ["reportes admin filtrados", () => reports.getAdminReports(2, 5, "product" as never, "pending" as never, "silla"), "GET",
    "/admin/reports", { params: { page: "2", limit: "5", target_type: "product", status: "pending", search: "silla" } }],
  ["detalle reporte", () => reports.getAdminReport("r1"), "GET", "/admin/reports/r1"],
  ["estado reporte sin respuesta", () => reports.updateReportStatus("r1", "reviewing" as never), "PATCH", "/admin/reports/r1/status",
    { body: { status: "reviewing" } }],
  ["estado reporte con respuesta", () => reports.updateReportStatus("r1", "resolved" as never, "Listo"), "PATCH",
    "/admin/reports/r1/status", { body: { status: "resolved", adminResponse: "Listo" } }],
];

describe("servicios públicos y de comprador · contrato HTTP", () => {
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

describe("servicios con archivos", () => {
  it("registro de empresa envía el certificado PDF y los datos en multipart", async () => {
    const http = mockApi({ "POST /auth/register-company": { message: "ok" } });
    const certificate = makeFile("rut.pdf", "application/pdf");
    await auth.registerCompany({
      certificate,
      full_name: "Ana",
      email: "a@b.co",
      password: "Secreta1!",
      tell: "3001112233",
      company_name: "ACME",
      company_address: "Calle 1",
      company_nit: "900123456",
      company_nit_dv: "7",
    });
    expect(formDataToObject(http.requests[0].body)).toEqual({
      certificate,
      full_name: "Ana",
      email: "a@b.co",
      password: "Secreta1!",
      tell: "3001112233",
      company_name: "ACME",
      company_address: "Calle 1",
      company_nit: "900123456",
      company_nit_dv: "7",
    });
  });

  it("foto de perfil va en el campo 'photo'", async () => {
    const http = mockApi({ "PATCH /auth/me/photo": {} });
    const photo = makeFile("yo.webp", "image/webp");
    await auth.updateMePhoto(photo);
    expect(formDataToObject(http.requests[0].body)).toEqual({ photo });
  });

  it("actualización pública de certificado: correo, contraseña y PDF, sin JWT", async () => {
    const http = mockApi({ "POST /company/certificate/update": { message: "ok", certificateStatus: "pending" } });
    const certificate = makeFile("c.pdf", "application/pdf");
    const res = await updateCompanyCertificate({ email: "e@b.co", password: "x", certificate });
    expect(res.certificateStatus).toBe("pending");
    expect(http.requests[0].headers.Authorization).toBeUndefined();
    expect(formDataToObject(http.requests[0].body)).toEqual({ email: "e@b.co", password: "x", certificate });
  });

  it("reporte con descripción y evidencias repetidas; sin descripción no envía el campo", async () => {
    const http = mockApi({ "POST /reports": { id: "r1" } });
    const a = makeFile("a.png", "image/png");
    const b = makeFile("b.jpg", "image/jpeg");
    await reports.createReport("product" as never, "p1", "fraude", "Copia", [a, b]);
    expect(formDataToObject(http.requests[0].body)).toEqual({
      targetType: "product",
      targetId: "p1",
      reason: "fraude",
      description: "Copia",
      evidences: [a, b],
    });

    await reports.createReport("company" as never, "e1", "spam");
    expect(formDataToObject(http.requests[1].body)).toEqual({ targetType: "company", targetId: "e1", reason: "spam" });
  });
});
