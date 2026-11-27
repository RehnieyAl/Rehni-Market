// Galería (carrusel horizontal deslizable) y productos relacionados (fila deslizable en móvil,
// cuadrícula desde sm): componentes distintos con comportamientos distintos.
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";

import ProductGallery from "./ProductGallery";
import RelatedProducts from "./RelatedProducts";
import { renderWithProviders } from "@/test/renderApp";
import { reply } from "@/test/http";

const IMAGES = [
  { id: "i1", url: "https://cdn.test/1.png", is_main: true },
  { id: "i2", url: "https://cdn.test/2.png", is_main: false },
  { id: "i3", url: "https://cdn.test/3.png", is_main: false },
];

function Gallery({ initial = IMAGES[0].url, onChange }: { initial?: string; onChange?: (url: string) => void }) {
  const [selected, setSelected] = useState(initial);
  return (
    <ProductGallery
      images={IMAGES}
      productName="Silla"
      selectedUrl={selected}
      onSelect={(url) => {
        setSelected(url);
        onChange?.(url);
      }}
    />
  );
}

// La imagen principal es la de la miniatura activa: todas las diapositivas siguen expuestas a
// tecnologías de apoyo, así que no se identifica por un alt exclusivo.
function currentImage() {
  const active = document.querySelector('button[aria-current="true"][aria-label^="Ver imagen"]');
  return active?.querySelector("img")?.getAttribute("src");
}

function track() {
  return screen.getByRole("region", { name: "Imágenes de Silla" });
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("ProductGallery · carrusel", () => {
  it("muestra cada imagen como diapositiva accesible con object-contain y texto alternativo", () => {
    render(<Gallery />);
    const slides = within(track()).getAllByRole("group");
    expect(slides).toHaveLength(3);
    expect(slides[0].className).toContain("snap-center");
    expect(track().className).toContain("snap-x");
    expect(track().className).toContain("overflow-x-auto");
    const main = screen.getByAltText("Silla");
    expect(main.getAttribute("src")).toBe("https://cdn.test/1.png");
    expect(main.className).toContain("object-contain");
    expect(screen.getByText("1 / 3")).toBeTruthy();
    expect(screen.getByAltText("Silla, imagen 3").getAttribute("loading")).toBe("lazy");
    expect(main.getAttribute("fetchpriority")).toBe("high");
    expect(track().className).toContain("overscroll-x-contain");
  });

  it("una imagen que no carga muestra un aviso en su diapositiva y en su miniatura", () => {
    render(<Gallery />);
    fireEvent.error(screen.getByAltText("Silla, imagen 2"));
    expect(screen.getByText("No se pudo cargar esta imagen")).toBeTruthy();
    const thumb = screen.getByRole("button", { name: "Ver imagen 2 de Silla" });
    expect(thumb.querySelector("img")).toBeNull();
  });

  it("miniaturas horizontales: la activa se resalta y al elegir otra cambia la principal", () => {
    render(<Gallery />);
    const first = screen.getByRole("button", { name: "Ver imagen 1 de Silla" });
    const third = screen.getByRole("button", { name: "Ver imagen 3 de Silla" });
    expect(first.getAttribute("aria-current")).toBe("true");
    expect(first.parentElement?.className).toContain("overflow-x-auto");
    expect(first.parentElement?.className).not.toContain("flex-col");

    fireEvent.click(third);
    expect(third.getAttribute("aria-current")).toBe("true");
    expect(first.getAttribute("aria-current")).toBe("false");
    expect(currentImage()).toBe("https://cdn.test/3.png");
    expect(screen.getByText("3 / 3")).toBeTruthy();
  });

  it("flechas y teclado avanzan y retroceden de forma circular", () => {
    const onChange = vi.fn();
    render(<Gallery onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Imagen anterior" }));
    expect(onChange).toHaveBeenLastCalledWith("https://cdn.test/3.png");
    fireEvent.click(screen.getByRole("button", { name: "Imagen siguiente" }));
    expect(onChange).toHaveBeenLastCalledWith("https://cdn.test/1.png");

    fireEvent.keyDown(track(), { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith("https://cdn.test/2.png");
    fireEvent.keyDown(track(), { key: "ArrowLeft" });
    expect(onChange).toHaveBeenLastCalledWith("https://cdn.test/1.png");
    fireEvent.keyDown(track(), { key: "Enter" });
    expect(onChange).toHaveBeenCalledTimes(4);
  });

  it("deslizar con el dedo selecciona la imagen que queda centrada al terminar (scrollend)", () => {
    const onChange = vi.fn();
    render(<Gallery onChange={onChange} />);
    const element = track();
    Object.defineProperty(element, "clientWidth", { configurable: true, value: 300 });
    Object.defineProperty(element, "scrollLeft", { configurable: true, writable: true, value: 590 });

    fireEvent(element, new Event("scrollend"));
    expect(onChange).toHaveBeenCalledWith("https://cdn.test/3.png");
  });

  it("sin scrollend, un scroll con espera hace de respaldo", () => {
    let owner: object | null = window;
    while (owner && !Object.prototype.hasOwnProperty.call(owner, "onscrollend")) {
      owner = Object.getPrototypeOf(owner);
    }
    const descriptor = owner ? Object.getOwnPropertyDescriptor(owner, "onscrollend") : undefined;
    if (owner) delete (owner as Record<string, unknown>).onscrollend;
    vi.useFakeTimers();
    try {
      const onChange = vi.fn();
      render(<Gallery onChange={onChange} />);
      const element = track();
      Object.defineProperty(element, "clientWidth", { configurable: true, value: 300 });
      Object.defineProperty(element, "scrollLeft", { configurable: true, writable: true, value: 590 });

      fireEvent.scroll(element);
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(onChange).toHaveBeenCalledWith("https://cdn.test/3.png");
    } finally {
      if (owner && descriptor) Object.defineProperty(owner, "onscrollend", descriptor);
    }
  });

  it("al cambiar la selección desde fuera, el carrusel se desplaza a esa diapositiva", () => {
    const scrollTo = vi.spyOn(Element.prototype, "scrollTo").mockImplementation(() => {});
    Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get: () => 300 });
    try {
      render(<Gallery />);
      fireEvent.click(screen.getByRole("button", { name: "Ver imagen 2 de Silla" }));
      expect(scrollTo).toHaveBeenLastCalledWith({ left: 300, behavior: "smooth" });
    } finally {
      delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientWidth;
    }
  });

  it("una sola imagen no muestra controles; sin imágenes muestra el aviso", () => {
    const { rerender } = render(
      <ProductGallery images={[IMAGES[0]]} productName="Silla" selectedUrl={IMAGES[0].url} onSelect={() => {}} />,
    );
    expect(screen.queryByRole("button", { name: "Imagen siguiente" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Ver imagen/ })).toBeNull();

    rerender(<ProductGallery images={[]} productName="Silla" selectedUrl={null} onSelect={() => {}} />);
    expect(screen.queryByRole("region")).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
  });
});

async function waitForImg(container: HTMLElement) {
  await vi.waitFor(() => expect(container.querySelector("img")).not.toBeNull());
  return container.querySelector("img") as HTMLImageElement;
}

const card = (id: string) => ({
  id,
  name: `Producto ${id}`,
  image: id === "a" ? null : `https://cdn.test/${id}.png`,
  company_name: "ACME",
  catalog_id: "k1",
  catalog_name: "Muebles",
  price: "1000",
  discount_enabled: false,
  discount_percentage: null,
  final_price: "1000",
  applies_tax: false,
  stock: 1,
  average_rating: null,
  review_count: 0,
});

describe("Productos relacionados · fila deslizable en móvil, cuadrícula en escritorio", () => {
  it("tarjetas compactas (imagen a la izquierda) sin el producto actual; en móvil se deslizan sin desbordar la página", async () => {
    const { http } = renderWithProviders(<RelatedProducts catalogId="k1" excludeProductId="b" />, {
      routes: { "GET /public/products": { page: 1, limit: 6, total: 3, total_pages: 1, products: [card("a"), card("b"), card("c")] } },
    });
    const section = await screen.findByRole("region", { name: "Productos relacionados" });
    const list = within(section).getByRole("list", { name: "Productos relacionados" });
    expect(list.className).toContain("snap-x");
    expect(list.className).toContain("overscroll-x-contain");
    expect(list.className).toContain("sm:grid");
    expect(list.className).toContain("xl:grid-cols-5");

    const items = await within(section).findAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining("Producto a"),
      expect.stringContaining("Producto c"),
    ]);
    expect(items[1].className).toContain("snap-start");
    const link = within(items[1]).getByRole("link");
    expect(link.getAttribute("href")).toBe("/products/c");
    expect(link.querySelector("img")?.className).toContain("object-contain");
    expect(items[0].querySelector("img")).toBeNull();
    expect(within(section).queryByRole("button", { name: /Anterior|Siguiente/ })).toBeNull();
    expect(http.calls("GET /public/products")[0].params).toEqual({ catalog_id: "k1", page: "1", limit: "6" });
  });

  it("una foto que no carga se reemplaza por el aviso sin romper la tarjeta", async () => {
    renderWithProviders(<RelatedProducts catalogId="k1" excludeProductId="b" />, {
      routes: { "GET /public/products": { page: 1, limit: 6, total: 1, total_pages: 1, products: [card("c")] } },
    });
    const section = await screen.findByRole("region", { name: "Productos relacionados" });
    const img = await waitForImg(section);
    fireEvent.error(img);
    expect(section.querySelector("img")).toBeNull();
    expect(within(section).getByText("Producto c")).toBeTruthy();
  });

  it("si no hay relacionados o falla la carga, la sección no se muestra", async () => {
    const { container } = renderWithProviders(<RelatedProducts catalogId="k1" excludeProductId="b" />, {
      routes: { "GET /public/products": reply(500) },
    });
    await vi.waitFor(() => expect(container.querySelector("section")).toBeNull());
  });
});
