// Identidad cromática única: dos colores de marca definidos solo en index.css, sin tonos alternativos
// por rol o sección, sin valores de marca escritos a mano y con primary reservado a los rellenos.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(process.cwd(), "src");
const css = readFileSync(join(SRC, "index.css"), "utf8");

const EMAIL_BASE = join(process.cwd(), "..", "RehniMarket-backend", "app", "services", "email", "template", "EmailBase.py");

const PRIMARY = "#8b0d35";
const SECONDARY = "#e51d48";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(tsx?|css)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

const files = sourceFiles(SRC).map((path) => ({ path: relative(SRC, path), text: readFileSync(path, "utf8") }));

function offenders(pattern: RegExp, skip: (path: string) => boolean = () => false): string[] {
  return files.filter(({ path, text }) => !skip(path) && pattern.test(text)).map(({ path }) => path);
}

describe("Colores de marca", () => {
  it("index.css define primary y secondary una sola vez con los valores oficiales", () => {
    expect(css.match(/--color-primary:\s*([^;]+);/g)).toEqual([`--color-primary: ${PRIMARY};`]);
    expect(css.match(/--color-secondary:\s*([^;]+);/g)).toEqual([`--color-secondary: ${SECONDARY};`]);
  });

  it("no hay tonos de marca alternativos ni sustitución por área", () => {
    expect(css).not.toMatch(/--color-(brand|accent|rm)-|--color-accent:|--color-primary-hover|--color-secondary-/);
    expect(css).not.toMatch(/data-panel/);
    expect(css).toMatch(/--color-red-\*:\s*initial/);
  });

  it("ningún archivo repite los valores de marca a mano", () => {
    const literal = /#8b0d35|#e51d48|139\s*,\s*13\s*,\s*53|229\s*,\s*29\s*,\s*72/i;
    expect(offenders(literal, (path) => path === "index.css")).toEqual([]);
  });

  it("ningún componente usa clases de tonos retirados o rojos de la paleta de Tailwind", () => {
    const retired = /(?<![\w-])(?:[a-z-]+:)*(?:bg|text|border|ring|outline|fill|stroke|from|via|to|accent|shadow)-(?:brand-\d+|accent(?:-hover)?|primary-hover|(?:red|rose|pink)-\d+)\b/;
    expect(offenders(retired)).toEqual([]);
  });

  it("primary solo rellena: como texto, borde o foco no alcanza 3:1 sobre el fondo oscuro", () => {
    const primaryAsInk = /(?<![\w-])(?:[a-z-]+:)*(?:text|border|ring|outline|decoration|fill|stroke)-primary(?![\w-])/;
    // Única excepción válida: tinta primary sobre una superficie blanca de la misma clase (9,5:1).
    const classStrings = files.flatMap(({ path, text }) =>
      (text.match(/["`][^"`\n]*["`]/g) ?? []).map((value) => ({ path, value })),
    );
    const misuse = classStrings
      .filter(({ value }) => primaryAsInk.test(value) && !/(?<![\w-])bg-white(?![\w/-])/.test(value))
      .map(({ path }) => path);
    expect(misuse).toEqual([]);
  });

  // Los correos no pueden leer variables CSS: EmailBase.py copia los valores y aquí se comprueba que coincidan.
  it.runIf(existsSync(EMAIL_BASE))("los correos usan exactamente los mismos colores de marca", () => {
    const email = readFileSync(EMAIL_BASE, "utf8");
    expect(email).toMatch(new RegExp(`^PRIMARY = "${PRIMARY}"$`, "m"));
    expect(email).toMatch(new RegExp(`^SECONDARY = "${SECONDARY}"$`, "m"));
    const reds = (email.match(/#[0-9a-fA-F]{6}\b/g) ?? []).filter((hex) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      return r > 90 && r > g * 1.8 && r > b * 1.4;
    });
    expect([...new Set(reds.map((hex) => hex.toLowerCase()))].sort()).toEqual([PRIMARY, SECONDARY].sort());
  });

  it("los paneles no marcan el body para cambiar la paleta", () => {
    expect(offenders(/dataset\.panel|data-panel/)).toEqual([]);
  });
});
