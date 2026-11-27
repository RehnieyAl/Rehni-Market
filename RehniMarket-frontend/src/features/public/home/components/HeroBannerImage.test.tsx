// Hero a todo el ancho: marco ligado a las plantillas, imagen sin deformar ni desenfoques,
// variante móvil, prioridad de carga, carrusel accesible y ausencia de anuncios.
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import HeroBannerImage from "./HeroBannerImage";
import { HERO_FRAME, HERO_FRAME_WEB_ONLY, HERO_MOBILE_MEDIA } from "./heroFrame";
import { renderApp } from "@/test/renderApp";
import { reply } from "@/test/http";

describe("heroFrame", () => {
  it("ocupa todo el ancho con las proporciones de las plantillas 1080×450 y 1600×300", () => {
    expect(HERO_FRAME).toContain("aspect-[12/5]");
    expect(HERO_FRAME).toContain("sm:aspect-[4/1]");
    expect(HERO_FRAME).toContain("lg:aspect-[16/3]");
    expect(HERO_FRAME).toContain("lg:max-h-[256px]");
    expect(HERO_FRAME).toContain("w-full");
    expect(HERO_FRAME).not.toMatch(/max-w-/);
    expect(HERO_FRAME_WEB_ONLY).toMatch(/^aspect-\[4\/1\] /);
    expect(HERO_MOBILE_MEDIA).toBe("(max-width: 639px)");
  });

  it("el tope de altura nunca recorta la zona segura de 264 px de la plantilla web", () => {
    const widestFrame = 1536;
    const visibleTemplateHeight = 256 / (widestFrame / 1600);
    expect(visibleTemplateHeight).toBeGreaterThanOrEqual(264);
  });
});

describe("HeroBannerImage", () => {
  it("llena el marco sin deformar ni añadir fondos desenfocados", () => {
    const { container } = render(<HeroBannerImage src="https://cdn.test/antiguo.png" />);
    const imgs = container.querySelectorAll("img");
    expect(imgs).toHaveLength(1);
    expect(imgs[0].className).toContain("object-cover");
    expect(imgs[0].className).not.toContain("blur");
    expect(imgs[0].getAttribute("width")).toBe("1600");
    expect(imgs[0].getAttribute("height")).toBe("300");
  });

  it("prioriza la imagen visible y difiere las ocultas", () => {
    const { container, rerender } = render(<HeroBannerImage src="https://cdn.test/a.png" priority="high" />);
    const img = () => container.querySelector("img") as HTMLImageElement;
    expect(img().getAttribute("fetchpriority")).toBe("high");
    expect(img().getAttribute("loading")).toBeNull();
    rerender(<HeroBannerImage src="https://cdn.test/a.png" priority="low" />);
    expect(img().getAttribute("fetchpriority")).toBe("low");
    expect(img().getAttribute("loading")).toBe("lazy");
  });

  it("con imagen móvil añade la fuente para pantallas pequeñas", () => {
    const { container } = render(<HeroBannerImage src="https://cdn.test/web.png" mobileSrc="https://cdn.test/movil.png" />);
    const source = container.querySelector("source") as HTMLSourceElement;
    expect(source.getAttribute("srcset")).toBe("https://cdn.test/movil.png");
    expect(source.getAttribute("media")).toBe(HERO_MOBILE_MEDIA);
  });
});

const ad = (id: string, extra = {}) => ({
  id,
  image_url: `https://cdn.test/${id}.png`,
  mobile_image_url: null,
  button_link: null,
  is_active: true,
  order: 0,
  created_at: "",
  target_type: null,
  target_catalog_id: null,
  minimum_discount: null,
  ...extra,
});

const HOME = {
  "GET /public/catalogs": [],
  "GET /public/products/new": { page: 1, limit: 6, total: 0, total_pages: 1, products: [] },
  "GET /public/products/offers": { page: 1, limit: 6, total: 0, total_pages: 1, products: [] },
};

const frameOf = (src: string) =>
  document.querySelector(`img[src="${src}"]`)?.closest("[class*='aspect-']") as HTMLElement;

describe("Hero en el Home", () => {
  it("usa el marco a todo el ancho y cambia de diapositiva con los indicadores", async () => {
    renderApp("/", {
      routes: {
        ...HOME,
        "GET /public/advertisements": [
          ad("a1", { mobile_image_url: "https://cdn.test/a1-movil.png", button_link: "/offers" }),
          ad("a2", { mobile_image_url: "https://cdn.test/a2-movil.png" }),
        ],
      },
    });
    const dot2 = await screen.findByRole("button", { name: "Ir al anuncio 2 de 2" }, { timeout: 2000 });
    const frame = frameOf("https://cdn.test/a1.png");
    for (const cls of HERO_FRAME.split(" ")) expect(frame.className).toContain(cls);
    expect(frame.className).not.toMatch(/(^| |:)h-\[\d+px\]|max-w-/);
    expect(screen.getByRole("region", { name: "Anuncios destacados" }).getAttribute("aria-roledescription")).toBe("carrusel");
    expect(screen.getByRole("link", { name: "Abrir anuncio 1 de 2" }).getAttribute("href")).toBe("/offers");
    expect(document.querySelector('img[src="https://cdn.test/a1.png"]')?.getAttribute("fetchpriority")).toBe("high");
    expect(document.querySelector('img[src="https://cdn.test/a2.png"]')?.getAttribute("loading")).toBe("lazy");

    fireEvent.click(dot2);
    expect(dot2.getAttribute("aria-current")).toBe("true");
    expect(screen.getByRole("status").textContent).toBe("Anuncio 2 de 2");
    expect(document.querySelector('source[srcset="https://cdn.test/a2-movil.png"]')).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Siguiente anuncio" }));
    expect(screen.getByRole("status").textContent).toBe("Anuncio 1 de 2");
    fireEvent.click(screen.getByRole("button", { name: "Anuncio anterior" }));
    expect(screen.getByRole("status").textContent).toBe("Anuncio 2 de 2");
  });

  it("si algún anuncio no tiene imagen móvil, todos usan la web en 4:1 para no recortarla de más", async () => {
    renderApp("/", {
      routes: {
        ...HOME,
        "GET /public/advertisements": [ad("b1"), ad("b2", { mobile_image_url: "https://cdn.test/b2-movil.png" })],
      },
    });
    await screen.findByRole("button", { name: "Ir al anuncio 2 de 2" }, { timeout: 2000 });
    for (const cls of HERO_FRAME_WEB_ONLY.split(" ")) expect(frameOf("https://cdn.test/b1.png").className).toContain(cls);
    expect(document.querySelector("source")).toBeNull();
  });

  it("el deslizamiento táctil cambia de anuncio", async () => {
    renderApp("/", { routes: { ...HOME, "GET /public/advertisements": [ad("c1"), ad("c2"), ad("c3")] } });
    await screen.findByRole("button", { name: "Ir al anuncio 3 de 3" }, { timeout: 2000 });
    const frame = frameOf("https://cdn.test/c1.png");
    fireEvent.touchStart(frame, { touches: [{ clientX: 200 }] });
    fireEvent.touchEnd(frame, { changedTouches: [{ clientX: 100 }] });
    expect(screen.getByRole("status").textContent).toBe("Anuncio 2 de 3");
    fireEvent.touchStart(frame, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(frame, { changedTouches: [{ clientX: 200 }] });
    expect(screen.getByRole("status").textContent).toBe("Anuncio 1 de 3");
  });
  it("sin anuncios activos o si falla la carga, el Hero no deja un recuadro vacío", async () => {
    renderApp("/", { routes: { ...HOME, "GET /public/advertisements": reply(500) } });
    await screen.findByText("No hay novedades disponibles en este momento.");
    await waitFor(() => expect(document.querySelector(".animate-pulse.rounded-2xl")).toBeNull(), { timeout: 2000 });
    expect(document.querySelector(".animate-hero-premium")).toBeNull();
  });
});
