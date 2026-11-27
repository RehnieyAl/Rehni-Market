// Entorno común de Vitest: almacenamiento en memoria, APIs de navegador ausentes en jsdom y limpieza.
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
}

if (typeof globalThis.localStorage === "undefined") {
  Object.defineProperty(globalThis, "localStorage", {
    value: new MemoryStorage(),
    configurable: true,
  });
}

if (typeof globalThis.sessionStorage === "undefined") {
  Object.defineProperty(globalThis, "sessionStorage", {
    value: new MemoryStorage(),
    configurable: true,
  });
}

// APIs del navegador que jsdom no implementa y que la app usa en layout y previsualizaciones.
if (typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
window.scrollTo = (() => {}) as typeof window.scrollTo;
Element.prototype.scrollIntoView ??= function scrollIntoView() {};
Element.prototype.scrollBy ??= function scrollBy() {};
Element.prototype.scrollTo ??= function scrollTo() {};
URL.createObjectURL ??= () => "blob:preview";
URL.revokeObjectURL ??= () => {};

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});
