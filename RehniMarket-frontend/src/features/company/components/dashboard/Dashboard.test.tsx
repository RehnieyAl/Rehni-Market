// Panel de empresa montado en la app real: inicio (cabecera, métricas, acciones rápidas, pedidos y
// productos recientes), mi tienda (logo/banner, certificado) y finanzas.
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";

import { renderApp } from "@/test/renderApp";
import { formDataToObject, makeFile, reply } from "@/test/http";

const HERO = {
  id: "e1",
  logo: null,
  banner: "https://cdn.test/banner.png",
  nameCompany: "ACME S.A.S",
  addressCompany: "Calle 1 # 2-3",
  description: "Muebles de calidad",
  certificate_status: "approved",
  rejection_reason: null,
  is_verified: true,
  memberAT: "2024-03-01T00:00:00Z",
};
const PROFILE = {
  id: "e1",
  nameCompany: "ACME S.A.S",
  addressCompany: "Calle 1 # 2-3",
  description: null,
  CompanyNIT: "900123456",
  CompanyNITDV: "7",
  CompanyStatus: true,
  suspensionReason: null,
  certificateStatus: "approved",
  rejectionReason: null,
  memberAT: "2024-03-01T00:00:00Z",
  logo: null,
  banner: null,
};
const SUMMARY = { total: 7, active: 5, out_of_stock: 1, hidden: 1 };
const PRODUCTS = {
  page: 1,
  limit: 10,
  total: 2,
  total_pages: 1,
  products: [
    { id: "p1", name: "Silla", description: "", category: "Muebles", price: 120000, stock: 4, image: null, is_active: true, deleted_at: null },
    { id: "p2", name: "Mesa", description: "", category: "Muebles", price: 300000, stock: 0, image: "https://cdn.test/m.png", is_active: false, deleted_at: null },
  ],
};
const BANK = {
  id: "b1",
  accountHolder: "ACME S.A.S",
  documentNumber: "900123456",
  bankId: "k1",
  bankName: "Bancolombia",
  bankLogoUrl: null,
  accountType: "savings",
  lastFourDigits: "7890",
  isDefault: true,
  createdAt: "2026-01-01",
  updatedAt: null,
};

const ORDER = (id: string, reference: string, status: string, minutesAgo: number, total: string) => ({
  id,
  reference,
  status,
  companyId: "e1",
  companyName: "ACME S.A.S",
  subtotal: total,
  tax: "0",
  total,
  createdAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
  items: [],
  firstItemName: null,
  totalItems: 1,
  buyerName: "Ana Compradora",
  buyerEmail: "ana@test.local",
  buyerPhoto: null,
  buyerPhone: null,
  deliveryAddress: null,
  shippingCarrier: null,
  trackingNumber: null,
  returns: [],
});
const ORDERS = {
  page: 1,
  limit: 5,
  total: 2,
  total_pages: 1,
  items: [ORDER("o1", "RM-54321", "paid", 15, "142400"), ORDER("o2", "RM-54320", "processing", 180, "169900")],
};

const BASE = {
  "GET /company/dashboard/orders": ORDERS,
  "GET /company/dashboard/me": HERO,
  "GET /company/dashboard/products-summary": SUMMARY,
  "GET /company/dashboard/get-my-products": PRODUCTS,
  "GET /public/company/:id/rating": { company_id: "e1", average_rating: 4.5, total_reviews: 2 },
};

/** Abre el modal Mi tienda desde "Editar perfil" y devuelve el diálogo. */
async function openStore() {
  await screen.findByRole("heading", { name: "ACME S.A.S" });
  fireEvent.click(screen.getByRole("button", { name: "Editar perfil" }));
  return screen.findByRole("dialog", { name: "Mi tienda" });
}

describe("Empresa · Inicio", () => {
  it("muestra identidad, verificación, reputación, métricas y productos recientes", async () => {
    renderApp("/company/dashboard", { role: "company", routes: BASE });
    expect(await screen.findByText("Panel Empresa")).toBeTruthy();
    expect(await screen.findByText("ACME S.A.S")).toBeTruthy();
    expect(screen.getByText("Empresa verificada")).toBeTruthy();
    expect(await screen.findByText(/4\.5 \(2\s+reseñas\)/)).toBeTruthy();
    expect(screen.getByText(/^Desde \S+ de 2024$/)).toBeTruthy();
    expect(screen.getByText("Muebles de calidad")).toBeTruthy();
    expect(screen.getByText("Calle 1 # 2-3")).toBeTruthy();
    expect(await screen.findByText("Silla")).toBeTruthy();
    expect(screen.getByText(/\$300\.000 · Stock 0/)).toBeTruthy();

    const stats = screen.getByRole("region", { name: "Resumen del catálogo" });
    expect(within(stats).getByText("7")).toBeTruthy();
    expect(within(stats).getByText("5")).toBeTruthy();
    expect(within(stats).getAllByText("1")).toHaveLength(2);
    expect(screen.getByAltText("Logo de ACME S.A.S").getAttribute("src")).toContain("logo-default");
  });

  it("pedidos recientes: datos reales con estado, total y tiempo relativo; sin ventas inventadas", async () => {
    const { http } = renderApp("/company/dashboard", { role: "company", routes: BASE });
    const orders = await screen.findByRole("region", { name: "Pedidos recientes" });
    expect(await within(orders).findByText("#RM-54321")).toBeTruthy();
    expect(within(orders).getByText("Pagado")).toBeTruthy();
    expect(within(orders).getByText("En preparación")).toBeTruthy();
    expect(within(orders).getByText("$142.400")).toBeTruthy();
    expect(within(orders).getByText(/hace 15 minutos/)).toBeTruthy();
    expect(within(orders).getByText(/hace 3 horas/)).toBeTruthy();
    expect(http.calls("GET /company/dashboard/orders")[0].params).toEqual({ page: "1", limit: "5" });
    expect(screen.queryByText(/Ventas de los últimos/)).toBeNull();

    fireEvent.click(within(orders).getByRole("button", { name: /Ver todos/ }));
    await waitFor(() => expect(window.location.search).toBe("?tab=orders"));
  });

  it("pedidos recientes: vacío y error con reintento", async () => {
    let fail = true;
    renderApp("/company/dashboard", {
      role: "company",
      routes: { ...BASE, "GET /company/dashboard/orders": () => (fail ? reply(500) : { ...ORDERS, items: [], total: 0 }) },
    });
    const orders = await screen.findByRole("region", { name: "Pedidos recientes" });
    expect(await within(orders).findByText("No se pudieron cargar los pedidos")).toBeTruthy();
    fail = false;
    fireEvent.click(within(orders).getByRole("button", { name: /Reintentar/ }));
    expect(await within(orders).findByText("Todavía no tienes pedidos")).toBeTruthy();
  });

  it("acciones rápidas llevan a secciones reales; Crear producto abre el formulario de alta", async () => {
    renderApp("/company/dashboard", { role: "company", routes: BASE });
    const actions = await screen.findByRole("region", { name: "Acciones rápidas" });

    fireEvent.click(within(actions).getByRole("button", { name: "Crear producto" }));
    await waitFor(() => expect(window.location.search).toBe("?tab=products&new=1"));
    expect(await screen.findByRole("heading", { name: "Crear nuevo producto" })).toBeTruthy();
  });

  it.each([
    ["Gestionar productos", "?tab=products"],
    ["Procesar pedidos", "?tab=orders"],
    ["Ver finanzas", "?tab=finance"],
  ])("acción rápida %s", async (label, search) => {
    renderApp("/company/dashboard", {
      role: "company",
      routes: { ...BASE, "GET /company/dashboard/my-profile": PROFILE },
    });
    const actions = await screen.findByRole("region", { name: "Acciones rápidas" });
    await act(async () => {
      fireEvent.click(within(actions).getByRole("button", { name: label }));
    });
    expect(window.location.search).toBe(search);
  });

  it("el panel no ofrece carrito, favoritos ni seguir", async () => {
    renderApp("/company/dashboard", { role: "company", routes: BASE });
    await screen.findByRole("heading", { name: "ACME S.A.S" });
    expect(screen.queryByRole("button", { name: /Seguir tienda/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /favoritos/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /al carrito/ })).toBeNull();
  });

  it("navegación lateral: la sección activa se marca con aria-current", async () => {
    renderApp("/company/dashboard?tab=orders", { role: "company", routes: BASE });
    const nav = (await screen.findAllByRole("button", { name: "Pedidos" }))[0];
    expect(nav.getAttribute("aria-current")).toBe("page");
    expect(nav.className).toContain("bg-primary");
    expect(screen.getAllByRole("button", { name: "Inicio" })[0].getAttribute("aria-current")).toBeNull();
  });

  it.each([
    ["rejected", "Empresa rechazada"],
    ["needs_update", "Certificado no válido"],
    ["pending", "Empresa pendiente de verificación"],
  ])("certificado %s se refleja en la insignia", async (status, label) => {
    renderApp("/company/dashboard", {
      role: "company",
      routes: {
        ...BASE,
        "GET /company/dashboard/me": { ...HERO, certificate_status: status },
        "GET /company/dashboard/get-my-products": { ...PRODUCTS, products: [] },
        "GET /public/company/:id/rating": { company_id: "e1", average_rating: null, total_reviews: 0 },
      },
    });
    expect(await screen.findByText(label)).toBeTruthy();
    expect(await screen.findByText("Aún no tienes productos publicados")).toBeTruthy();
    expect(await screen.findByText("Sin calificaciones todavía")).toBeTruthy();
  });

  it("'Ver todos' de productos recientes abre la pestaña de productos", async () => {
    renderApp("/company/dashboard", { role: "company", routes: BASE });
    const recent = await screen.findByRole("region", { name: "Productos recientes" });
    fireEvent.click(within(recent).getByRole("button", { name: /Ver todos/ }));
    expect(await screen.findByText("Administra todos los productos de tu empresa.")).toBeTruthy();
  });
});

describe("Empresa · Mi tienda", () => {
  it("edita la información pública y la guarda", async () => {
    const { http } = renderApp("/company/dashboard", {
      role: "company",
      routes: { ...BASE, "GET /company/dashboard/my-profile": PROFILE, "PATCH /company/dashboard/upgrade-my-profile": {} },
    });
    await openStore();
    expect(await screen.findByDisplayValue("ACME S.A.S")).toBeTruthy();
    expect(screen.getByText("900123456")).toBeTruthy();
    expect(screen.getByText("Aprobado")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Editar información de la empresa" }));
    fireEvent.change(screen.getByLabelText(/Dirección/), { target: { value: "Carrera 9" } });
    fireEvent.change(screen.getByLabelText(/Descripción/), { target: { value: "Nueva descripción" } });
    fireEvent.click(screen.getByRole("button", { name: /Guardar/ }));

    await waitFor(() => expect(http.calls("PATCH /company/dashboard/upgrade-my-profile")).toHaveLength(1));
    expect(http.calls("PATCH /company/dashboard/upgrade-my-profile")[0].body).toEqual({
      nameCompany: "ACME S.A.S",
      addressCompany: "Carrera 9",
      description: "Nueva descripción",
      contactEmail: "",
      contactPhone: "",
      contactPublic: false,
    });
    expect((screen.getByLabelText(/Dirección/) as HTMLInputElement).disabled).toBe(true);
  });

  it("contacto empresarial: valida y guarda correo y teléfono propios de la empresa", async () => {
    const { http } = renderApp("/company/dashboard", {
      role: "company",
      routes: { ...BASE, "GET /company/dashboard/my-profile": PROFILE, "PATCH /company/dashboard/upgrade-my-profile": {} },
    });
    const dialog = await openStore();
    await within(dialog).findByDisplayValue("ACME S.A.S");
    expect(within(dialog).getByText(/solo lo ven en tu perfil público si activas/)).toBeTruthy();
    const publish = within(dialog).getByRole("checkbox", { name: /Mostrar este correo y teléfono en mi perfil público/ });
    expect((publish as HTMLInputElement).checked).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Editar información de la empresa" }));
    fireEvent.change(within(dialog).getByLabelText("Correo de contacto"), { target: { value: "no-es-correo" } });
    fireEvent.change(within(dialog).getByLabelText("Teléfono de contacto"), { target: { value: "12" } });
    expect(within(dialog).getByText("Escribe un correo de contacto válido.")).toBeTruthy();
    expect(within(dialog).getByText("El teléfono de contacto debe tener entre 7 y 15 dígitos.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Guardar/ }));
    expect(http.calls("PATCH /company/dashboard/upgrade-my-profile")).toHaveLength(0);

    fireEvent.change(within(dialog).getByLabelText("Correo de contacto"), { target: { value: "soporte@acme.co" } });
    fireEvent.change(within(dialog).getByLabelText("Teléfono de contacto"), { target: { value: "601 555 1234" } });
    fireEvent.click(publish);
    fireEvent.click(screen.getByRole("button", { name: /Guardar/ }));
    await waitFor(() => expect(http.calls("PATCH /company/dashboard/upgrade-my-profile")).toHaveLength(1));
    expect(http.calls("PATCH /company/dashboard/upgrade-my-profile")[0].body).toMatchObject({
      contactEmail: "soporte@acme.co",
      contactPhone: "601 555 1234",
      contactPublic: true,
    });
  });

  it("logo y banner: rechaza formatos no admitidos y sube los válidos en multipart", async () => {
    const { http } = renderApp("/company/dashboard", {
      role: "company",
      routes: {
        ...BASE,
        "GET /company/dashboard/my-profile": PROFILE,
        "PATCH /company/dashboard/patch-media-logo-banner": { logo: "https://cdn.test/new-logo.png", banner: null },
      },
    });
    await openStore();
    await screen.findByDisplayValue("ACME S.A.S");
    const [logoInput, bannerInput] = Array.from(document.querySelectorAll('input[type="file"]')) as HTMLInputElement[];
    const update = screen.getByRole("button", { name: /Actualizar imágenes/ }) as HTMLButtonElement;
    expect(update.disabled).toBe(true);

    fireEvent.change(logoInput, { target: { files: [makeFile("logo.gif", "image/gif")] } });
    expect(await screen.findByText("Logo: solo se admite JPEG, PNG, WEBP.")).toBeTruthy();
    fireEvent.change(bannerInput, { target: { files: [makeFile("b.png", "image/png", 6 * 1024 * 1024)] } });
    expect(await screen.findByText("Banner: el archivo supera el máximo de 5 MB.")).toBeTruthy();
    expect(update.disabled).toBe(true);

    const logo = makeFile("logo.webp", "image/webp");
    const banner = makeFile("banner.jpg", "image/jpeg");
    fireEvent.change(logoInput, { target: { files: [logo] } });
    fireEvent.change(bannerInput, { target: { files: [banner] } });
    expect(screen.getByText("Imagen seleccionada: logo.webp")).toBeTruthy();
    fireEvent.click(update);

    await waitFor(() => expect(http.calls("PATCH /company/dashboard/patch-media-logo-banner")).toHaveLength(1));
    expect(formDataToObject(http.calls("PATCH /company/dashboard/patch-media-logo-banner")[0].body)).toEqual({
      photo_profile: logo,
      banner_profile: banner,
    });
    await waitFor(() => expect(screen.queryByText("Imagen seleccionada: logo.webp")).toBeNull());
  });

  it("un 413 del servidor al subir imágenes muestra el motivo", async () => {
    renderApp("/company/dashboard", {
      role: "company",
      routes: {
        ...BASE,
        "GET /company/dashboard/my-profile": PROFILE,
        "PATCH /company/dashboard/patch-media-logo-banner": reply(413, "<html>413</html>"),
      },
    });
    await openStore();
    await screen.findByDisplayValue("ACME S.A.S");
    const [logoInput] = Array.from(document.querySelectorAll('input[type="file"]')) as HTMLInputElement[];
    fireEvent.change(logoInput, { target: { files: [makeFile("logo.png", "image/png")] } });
    fireEvent.click(screen.getByRole("button", { name: /Actualizar imágenes/ }));
    expect(await screen.findByText("El archivo supera el máximo de 5 MB.")).toBeTruthy();
  });

  it("certificado inválido enlaza a actualizarlo; rechazado pide contactar soporte; suspensión con motivo", async () => {
    renderApp("/company/dashboard", {
      role: "company",
      routes: {
        ...BASE,
        "GET /company/dashboard/my-profile": { ...PROFILE, certificateStatus: "needs_update", rejectionReason: "  Vencido " },
      },
    });
    await openStore();
    expect(await screen.findByText("Vencido")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Actualizar certificado/ }).getAttribute("href")).toBe("/actualizar-certificado");
  });

  it("empresa rechazada sin motivo y suspendida", async () => {
    renderApp("/company/dashboard", {
      role: "company",
      routes: {
        ...BASE,
        "GET /company/dashboard/my-profile": {
          ...PROFILE,
          certificateStatus: "rejected",
          rejectionReason: null,
          CompanyStatus: false,
          suspensionReason: "Fraude",
        },
      },
    });
    await openStore();
    expect(await screen.findByText(/El administrador no registró un motivo/)).toBeTruthy();
    expect(screen.getByText(/Contacta con\s+soporte/)).toBeTruthy();
    expect(screen.getByText("Suspendida")).toBeTruthy();
    expect(screen.getByText("Motivo: Fraude")).toBeTruthy();
  });
});

describe("Empresa · modal Mi tienda", () => {
  it.each(["Editar perfil", "Configurar mi tienda"])("%s abre el mismo modal sin cambiar de sección", async (label) => {
    renderApp("/company/dashboard", { role: "company", routes: { ...BASE, "GET /company/dashboard/my-profile": PROFILE } });
    await screen.findByRole("heading", { name: "ACME S.A.S" });
    fireEvent.click(screen.getAllByRole("button", { name: label })[0]);
    const dialog = await screen.findByRole("dialog", { name: "Mi tienda" });
    expect(window.location.search).toBe("");
    expect(await within(dialog).findByDisplayValue("ACME S.A.S")).toBeTruthy();
  });

  it("solo tres secciones empresariales, sin datos del representante", async () => {
    renderApp("/company/dashboard", { role: "company", routes: { ...BASE, "GET /company/dashboard/my-profile": PROFILE } });
    const dialog = await openStore();
    await within(dialog).findByDisplayValue("ACME S.A.S");

    const titles = within(dialog).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
    expect(titles).toEqual(["Imagen de la empresa", "Información de la empresa", "Certificado empresarial"]);
    expect(within(dialog).getByText("Personaliza la imagen que verán tus clientes.")).toBeTruthy();
    expect(within(dialog).getByText(/1600 × 420 px \(PNG, JPG o WebP\)/)).toBeTruthy();
    expect(within(dialog).queryByText(/Información del representante/)).toBeNull();
    expect(within(dialog).queryByText(/Nombre del representante/)).toBeNull();
    expect(within(dialog).queryByDisplayValue("3001234567")).toBeNull();
    expect((within(dialog).getByLabelText("Teléfono de contacto") as HTMLInputElement).value).toBe("");
    expect(within(dialog).queryByText(/company@test\.local/)).toBeNull();
    expect(within(dialog).getByText("900123456")).toBeTruthy();
    expect(within(dialog).getByText("Aprobado")).toBeTruthy();
  });

  it("descarga las plantillas de logo y banner", async () => {
    renderApp("/company/dashboard", { role: "company", routes: { ...BASE, "GET /company/dashboard/my-profile": PROFILE } });
    const dialog = await openStore();
    const downloads: string[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push(this.download);
    });
    try {
      for (const button of within(dialog).getAllByRole("button", { name: /Descargar plantilla/ })) fireEvent.click(button);
    } finally {
      click.mockRestore();
    }
    expect(downloads).toEqual(["plantilla-logo-empresa-600x600.png", "plantilla-banner-empresa-1600x420.png"]);
  });

  it("guardar la información refresca la cabecera del panel", async () => {
    let name = "ACME S.A.S";
    const { http } = renderApp("/company/dashboard", {
      role: "company",
      routes: {
        ...BASE,
        "GET /company/dashboard/me": () => ({ ...HERO, nameCompany: name }),
        "GET /company/dashboard/my-profile": () => ({ ...PROFILE, nameCompany: name }),
        "PATCH /company/dashboard/upgrade-my-profile": () => {
          name = "ACME Renovada";
          return {};
        },
      },
    });
    const dialog = await openStore();
    await within(dialog).findByDisplayValue("ACME S.A.S");
    fireEvent.click(within(dialog).getByRole("button", { name: "Editar información de la empresa" }));
    fireEvent.change(within(dialog).getByLabelText(/Razón social/), { target: { value: "ACME Renovada" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /Guardar/ }));

    expect(await screen.findByRole("heading", { name: "ACME Renovada" })).toBeTruthy();
    expect(http.calls("GET /company/dashboard/me").length).toBeGreaterThanOrEqual(2);
  });

  it("avisa antes de cerrar con cambios sin guardar; sin cambios, Escape cierra y devuelve el foco", async () => {
    renderApp("/company/dashboard", { role: "company", routes: { ...BASE, "GET /company/dashboard/my-profile": PROFILE } });
    const dialog = await openStore();
    await within(dialog).findByDisplayValue("ACME S.A.S");

    fireEvent.click(within(dialog).getByRole("button", { name: "Editar información de la empresa" }));
    fireEvent.change(within(dialog).getByLabelText(/Dirección/), { target: { value: "Otra" } });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(await within(dialog).findByText(/Tienes cambios sin guardar/)).toBeTruthy();
    const keepEditing = within(dialog).getByRole("button", { name: "Seguir editando" });
    expect(keepEditing.getAttribute("aria-describedby")).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(keepEditing));
    fireEvent.click(keepEditing);
    expect(screen.getByRole("dialog", { name: "Mi tienda" })).toBeTruthy();
    expect((within(dialog).getByLabelText(/Dirección/) as HTMLInputElement).value).toBe("Otra");

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(await within(dialog).findByRole("button", { name: "Descartar cambios" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Mi tienda" })).toBeNull());

    const reopened = await openStore();
    expect(await within(reopened).findByDisplayValue("Calle 1 # 2-3")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Mi tienda" })).toBeNull());
    expect(document.activeElement?.textContent).toContain("Editar perfil");
  });

  it("error al cargar la tienda con reintento", async () => {
    let fail = true;
    renderApp("/company/dashboard", {
      role: "company",
      routes: { ...BASE, "GET /company/dashboard/my-profile": () => (fail ? reply(500) : PROFILE) },
    });
    const dialog = await openStore();
    expect(await within(dialog).findByText("No se pudo cargar la información de la tienda")).toBeTruthy();
    fail = false;
    fireEvent.click(within(dialog).getByRole("button", { name: /Reintentar/ }));
    expect(await within(dialog).findByDisplayValue("ACME S.A.S")).toBeTruthy();
  });

  it("la navegación lateral ya no tiene Mi tienda y Configuración de cuenta sigue disponible", async () => {
    renderApp("/company/dashboard?tab=company", { role: "company", routes: BASE });
    await screen.findByRole("heading", { name: "ACME S.A.S" });
    expect(screen.queryByRole("button", { name: "Mi tienda" })).toBeNull();
    expect(screen.getAllByRole("button", { name: "Inicio" })[0].getAttribute("aria-current")).toBe("page");
    expect(screen.getAllByRole("button", { name: "Configuración de cuenta" }).length).toBeGreaterThan(0);
  });
});

describe("Empresa · Configuración de cuenta", () => {
  it("perfil, cuenta y seguridad con los datos del representante; foto accesible por teclado", async () => {
    const { http } = renderApp("/company/dashboard?tab=profile", {
      role: "company",
      routes: { ...BASE, "PATCH /auth/me": {} },
    });
    expect(await screen.findByRole("heading", { level: 1, name: "Configuración de cuenta" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual(["Perfil", "Cuenta", "Seguridad"]);
    expect((await screen.findByLabelText("Nombre") as HTMLInputElement).value).toBe("Cuenta company");
    expect((screen.getByLabelText("Teléfono") as HTMLInputElement).value).toBe("3001234567");
    expect((screen.getByLabelText("Correo electrónico") as HTMLInputElement).value).toBe("company@rehni.test");

    const photo = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(photo.hidden).toBe(false);
    expect(photo.className).toContain("sr-only");

    fireEvent.click(screen.getByRole("button", { name: "Editar perfil" }));
    fireEvent.change(screen.getByLabelText("Teléfono"), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: /Guardar/ }));
    expect(await screen.findByText("El teléfono debe tener exactamente 10 dígitos.")).toBeTruthy();
    expect(http.calls("PATCH /auth/me")).toHaveLength(0);
    expect(screen.getByRole("button", { name: /Cambiar contraseña/ })).toBeTruthy();
  });
});

describe("Empresa · Finanzas", () => {
  it("resumen con saldo neto (ganancias) y error si no carga", async () => {
    renderApp("/company/dashboard?tab=finance", {
      role: "company",
      routes: {
        ...BASE,
        "GET /company/balance": {
          grossSalesAccumulated: "1000000",
          commissionAccumulated: "50000",
          netBalance: "950000",
          nextPayoutDate: "2026-12-01T00:00:00Z",
        },
      },
    });
    expect(await screen.findByText("$1.000.000")).toBeTruthy();
    expect(screen.getByText("$50.000")).toBeTruthy();
    expect(screen.getByText("$950.000")).toBeTruthy();
  });

  it("si el balance falla muestra el error", async () => {
    renderApp("/company/dashboard?tab=finance", {
      role: "company",
      routes: { ...BASE, "GET /company/balance": reply(500) },
    });
    expect(await screen.findByText("No se pudo cargar el resumen financiero")).toBeTruthy();
  });

  it("liquidaciones: lista, detalle y paginación", async () => {
    const payout = {
      id: "p1",
      companyId: "e1",
      companyName: "ACME",
      periodStart: "2026-10-01T00:00:00",
      periodEnd: "2026-10-31T00:00:00",
      grossSales: "200000",
      commissionPercentage: "0.05",
      commissionAmount: "10000",
      netAmount: "190000",
      payoutStatus: "paid",
      bankAccount: { bankName: "Bancolombia", accountType: "nequi", accountNumber: "300", lastFourDigits: "0300" },
      rehniCoinMovement: null,
      paidAt: "2026-11-05T00:00:00Z",
      createdAt: "2026-11-01T00:00:00Z",
    };
    const { http } = renderApp("/company/dashboard?tab=finance", {
      role: "company",
      routes: {
        ...BASE,
        "GET /company/balance": reply(500),
        "GET /company/payouts": { items: [payout], total: 11, page: 1, limit: 10, total_pages: 2 },
        "GET /company/payouts/:id": payout,
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Liquidaciones" }));
    const table = await screen.findByRole("table", { name: "Liquidaciones de tu empresa" });
    const row = within(table).getAllByRole("row")[1];
    expect(within(row).getByRole("rowheader").textContent).toContain("P1");
    expect(within(row).getByText("$200.000")).toBeTruthy();
    expect(within(row).getByText("$10.000")).toBeTruthy();
    expect(within(row).getByText("$190.000")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await waitFor(() => expect(http.calls("GET /company/payouts").at(-1)?.params.page).toBe("2"));
    fireEvent.click(await screen.findByRole("button", { name: "Anterior" }));

    fireEvent.click(await screen.findByRole("button", { name: /Ver detalle de la liquidación/ }));
    expect(await screen.findByText("Detalle de liquidación")).toBeTruthy();
    expect(await screen.findByText("Nequi")).toBeTruthy();
  });

  it("resumen: liquidaciones recientes y cuentas bancarias junto a las métricas", async () => {
    const { http } = renderApp("/company/dashboard?tab=finance", {
      role: "company",
      routes: {
        ...BASE,
        "GET /company/balance": reply(500),
        "GET /company/payouts": { items: [], total: 0, page: 1, limit: 4, total_pages: 0 },
        "GET /company/bank-accounts": [BANK],
      },
    });
    expect(await screen.findByRole("heading", { name: "Finanzas" })).toBeTruthy();
    expect(await screen.findByRole("region", { name: "Liquidaciones recientes" })).toBeTruthy();
    const banks = await screen.findByRole("region", { name: "Cuentas bancarias" });
    expect(await within(banks).findByText("Bancolombia")).toBeTruthy();
    expect(within(banks).queryByRole("button", { name: /Eliminar la cuenta/ })).toBeNull();
    await waitFor(() => expect(http.calls("GET /company/payouts")[0]?.params.limit).toBe("4"));

    fireEvent.click(screen.getByRole("button", { name: /Ver todas/ }));
    expect(screen.getByRole("button", { name: "Liquidaciones" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("la pestaña de cuentas bancarias permite gestionarlas", async () => {
    renderApp("/company/dashboard?tab=finance", {
      role: "company",
      routes: {
        ...BASE,
        "GET /company/balance": reply(500),
        "GET /company/payouts": { items: [], total: 0, page: 1, limit: 4, total_pages: 0 },
        "GET /company/bank-accounts": [BANK],
        "GET /company/bank-accounts/banks": [{ id: "k1", name: "Bancolombia", logoUrl: null }],
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Cuentas bancarias" }));
    expect(await screen.findByRole("button", { name: "Eliminar la cuenta de Bancolombia terminada en 7890" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Agregar cuenta bancaria/ }));
    expect(await screen.findByRole("dialog", { name: "Nueva cuenta bancaria" })).toBeTruthy();
  });
});
