// Banners de empresa: marco único (plantilla, personalizado, error y vista previa) en todas las vistas.
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import CompanyBanner, { BANNER_FRAME, BANNER_SIZE_HINT } from "./CompanyBanner";
import { renderApp } from "@/test/renderApp";
import { makeFile } from "@/test/http";

// La imagen vive dentro de <picture>; el marco con la proporción es el <div> que lo envuelve.
function frameOf(img: HTMLElement) {
  return img.closest("div") as HTMLElement;
}

describe("CompanyBanner", () => {
  it("sin imagen usa la plantilla con el marco de la franja segura, centrada y sin deformar", () => {
    render(<CompanyBanner alt="Banner" />);
    const img = screen.getByAltText("Banner") as HTMLImageElement;
    expect(img.src).toContain("banner-template");
    expect(img.className).toContain("object-cover");
    expect(img.className).toContain("object-center");
    expect(frameOf(img).className).toContain(BANNER_FRAME);
    const mobile = img.parentElement?.querySelector("source");
    expect(mobile?.getAttribute("media")).toBe("(max-width: 639px)");
    expect(mobile?.getAttribute("srcset")).toContain("company-banner-mobile");
  });

  it("las plantillas no piden prioridad salvo que el banner sea la imagen principal de la página", () => {
    const { rerender } = render(<CompanyBanner alt="Banner" />);
    expect(screen.getByAltText("Banner").getAttribute("fetchpriority")).toBeNull();
    rerender(<CompanyBanner alt="Banner" priority />);
    expect(screen.getByAltText("Banner").getAttribute("fetchpriority")).toBe("high");
  });

  it("un banner personalizado se muestra en el mismo marco y vuelve a la plantilla si falla", () => {
    render(<CompanyBanner src="https://cdn.test/mi-banner.jpg" alt="Banner" />);
    const img = screen.getByAltText("Banner") as HTMLImageElement;
    expect(img.src).toBe("https://cdn.test/mi-banner.jpg");
    expect(img.parentElement?.querySelector("source")).toBeNull();
    fireEvent.error(img);
    expect((screen.getByAltText("Banner") as HTMLImageElement).src).toContain("banner-template");
  });

  it("con placeholder no muestra la plantilla y conserva la proporción", () => {
    const { container } = render(<CompanyBanner placeholder={<span>Sin banner</span>} />);
    expect(screen.getByText("Sin banner")).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
    expect((container.firstChild as HTMLElement).className).toContain(BANNER_FRAME);
  });

  it("sin texto alternativo es decorativo", () => {
    const { container } = render(<CompanyBanner />);
    expect(container.querySelector("img")?.getAttribute("aria-hidden")).toBe("true");
  });
});

const PROFILE = {
  id: "e1",
  nameCompany: "ACME",
  addressCompany: "Calle 1",
  description: null,
  CompanyNIT: "900",
  CompanyNITDV: "1",
  CompanyStatus: true,
  suspensionReason: null,
  certificateStatus: "approved",
  rejectionReason: null,
  memberAT: "2024-01-01",
  banner: "https://cdn.test/actual.jpg",
};

describe("Banner en las vistas reales", () => {
  it("Mi tienda: la vista previa del banner subido usa el mismo marco que el perfil público y muestra el tamaño recomendado", async () => {
    renderApp("/company/dashboard", {
      role: "company",
      routes: {
        "GET /company/dashboard/me": { ...PROFILE, logo: null, certificate_status: "approved", memberAT: "2024-01-01" },
        "GET /company/dashboard/products-summary": { total: 0, active: 0, out_of_stock: 0, hidden: 0 },
        "GET /company/dashboard/get-my-products": { page: 1, limit: 10, total: 0, total_pages: 1, products: [] },
        "GET /company/dashboard/my-profile": PROFILE,
        "GET /public/company/:id/rating": { average_rating: null, total_reviews: 0 },
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Editar perfil" }));
    const preview = (await screen.findByAltText("Banner empresa")) as HTMLImageElement;
    await waitFor(() => expect(preview.src).toBe("https://cdn.test/actual.jpg"));
    expect(frameOf(preview).className).toContain(BANNER_FRAME);
    expect(screen.getByText(BANNER_SIZE_HINT)).toBeTruthy();

    const bannerInput = Array.from(document.querySelectorAll('input[type="file"]'))[1] as HTMLInputElement;
    fireEvent.change(bannerInput, { target: { files: [makeFile("nuevo.webp", "image/webp")] } });
    expect((screen.getByAltText("Banner empresa") as HTMLImageElement).src).toContain("blob:");
  });

  it("panel de empresa: el banner es el fondo de la cabecera, recortado sin deformar", async () => {
    renderApp("/company/dashboard", {
      role: "company",
      routes: {
        "GET /company/dashboard/me": { ...PROFILE, logo: null, certificate_status: "approved", memberAT: "2024-01-01" },
        "GET /company/dashboard/products-summary": { total: 0, active: 0, out_of_stock: 0, hidden: 0 },
        "GET /company/dashboard/get-my-products": { page: 1, limit: 10, total: 0, total_pages: 1, products: [] },
        "GET /public/company/:id/rating": { average_rating: null, total_reviews: 0 },
      },
    });
    const banner = (await screen.findByAltText("Banner de la empresa")) as HTMLImageElement;
    await waitFor(() => expect(banner.src).toBe("https://cdn.test/actual.jpg"));
    expect(frameOf(banner).className).toContain("absolute inset-0");
    expect(frameOf(banner).className).not.toContain(BANNER_FRAME);
    expect(banner.className).toContain("object-cover");
  });

  it("perfil público: banner en franja propia (sin capa encima) y logo superpuesto", async () => {
    renderApp("/company/e1", {
      routes: {
        "GET /public/company/:id": {
          id: "e1",
          name: "ACME",
          description: null,
          logo_url: null,
          banner_url: "https://cdn.test/publico.jpg",
          is_verified: false,
          created_at: "2024-01-01",
          total_products: 0,
        },
        "GET /public/company/:id/rating": { average_rating: null, total_reviews: 0 },
        "GET /public/company/:id/products": { page: 1, limit: 12, total: 0, total_pages: 1, products: [] },
      },
    });
    await screen.findByRole("heading", { name: "ACME" });
    const banner = document.querySelector('img[src="https://cdn.test/publico.jpg"]') as HTMLImageElement;
    expect(banner.className).toContain("object-center");
    expect(banner.className).not.toContain("object-right");
    expect(frameOf(banner).className).toContain(BANNER_FRAME);
    expect(within(frameOf(banner)).queryByText("ACME")).toBeNull();
  });
});
