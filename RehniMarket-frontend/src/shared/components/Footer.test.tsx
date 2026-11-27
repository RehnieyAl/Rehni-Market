// Pie público: el contacto institucional aparece solo si el owner lo publicó, con enlaces mailto/tel.
import { afterEach, describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";

import Footer from "./Footer";
import { renderWithProviders } from "@/test/renderApp";
import { reply } from "@/test/http";
import { resetPublicPlatformContactCache } from "@/features/platform/hooks/usePublicPlatformContact";

afterEach(() => {
  resetPublicPlatformContactCache();
});

describe("Footer", () => {
  it("muestra el correo y el teléfono publicados como enlaces", async () => {
    renderWithProviders(<Footer />, {
      routes: { "GET /public/platform-contact": { email: "soporte@rehni.test", phone: "+576015550101" } },
    });

    const email = await screen.findByRole("link", { name: "soporte@rehni.test" });
    expect(email.getAttribute("href")).toBe("mailto:soporte@rehni.test");
    expect(screen.getByRole("link", { name: "+576015550101" }).getAttribute("href")).toBe("tel:+576015550101");
  });

  it("solo lo publicado: sin teléfono no hay enlace tel", async () => {
    renderWithProviders(<Footer />, {
      routes: { "GET /public/platform-contact": { email: "soporte@rehni.test", phone: null } },
    });

    await screen.findByRole("link", { name: "soporte@rehni.test" });
    expect(document.querySelector('a[href^="tel:"]')).toBeNull();
  });

  it.each([
    ["nada publicado", { email: null, phone: null }],
    ["error de la API", reply(500)],
  ])("%s: no deja un bloque de contacto vacío", async (_, response) => {
    const { http } = renderWithProviders(<Footer />, { routes: { "GET /public/platform-contact": response } });

    await waitFor(() => expect(http.calls("GET /public/platform-contact")).toHaveLength(1));
    expect(screen.queryByRole("heading", { name: "Contacto" })).toBeNull();
  });
});
