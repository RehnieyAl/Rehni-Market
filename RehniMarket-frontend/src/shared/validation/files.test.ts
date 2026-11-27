// Validación de archivos: espejo de las reglas del backend (tipos, tamaño máximo y vacíos).
import { describe, expect, it } from "vitest";

import { FILE_ACCEPT, MAX_UPLOAD_BYTES, firstFileError, validateFile } from "./files";

const file = (name: string, type: string, size = 10) =>
  new File([new Uint8Array(size)], name, { type });

describe("validateFile", () => {
  it.each([
    ["foto.jpg", "image/jpeg"],
    ["foto.JPEG", "image/jpeg"],
    ["foto.png", "image/png"],
    ["foto.webp", "image/webp"],
  ])("acepta la imagen %s", (name, type) => {
    expect(validateFile(file(name, type), "image", "Imagen")).toBeNull();
  });

  it("acepta un PDF donde se piden documentos", () => {
    expect(validateFile(file("camara.pdf", "application/pdf"), "pdf", "Certificado")).toBeNull();
  });

  it("acepta un archivo de exactamente 5 MB", () => {
    expect(validateFile(file("a.png", "image/png", MAX_UPLOAD_BYTES), "image", "Imagen")).toBeNull();
  });

  it("rechaza un archivo de más de 5 MB", () => {
    expect(validateFile(file("a.png", "image/png", MAX_UPLOAD_BYTES + 1), "image", "Imagen")).toBe(
      "Imagen: el archivo supera el máximo de 5 MB.",
    );
  });

  it.each([
    ["animacion.gif", "image/gif"],
    ["camara.pdf", "application/pdf"],
    ["sin-extension", "image/png"],
  ])("rechaza %s en un campo de imágenes", (name, type) => {
    expect(validateFile(file(name, type), "image", "Imagen")).toBe("Imagen: solo se admite JPEG, PNG, WEBP.");
  });

  it("rechaza una imagen en un campo de PDF", () => {
    expect(validateFile(file("foto.png", "image/png"), "pdf", "Certificado")).toBe("Certificado: solo se admite PDF.");
  });

  it("rechaza una extensión que no coincide con el tipo declarado", () => {
    expect(validateFile(file("foto.png", "application/pdf"), "image", "Imagen")).not.toBeNull();
  });

  it("rechaza un archivo vacío", () => {
    expect(validateFile(file("a.png", "image/png", 0), "image", "Imagen")).toBe("Imagen: el archivo está vacío.");
  });

  it("firstFileError devuelve el primer error de un lote", () => {
    const files = [file("ok.png", "image/png"), file("mal.gif", "image/gif"), file("vacio.png", "image/png", 0)];

    expect(firstFileError(files, "image", "Imagen")).toBe("Imagen: solo se admite JPEG, PNG, WEBP.");
    expect(firstFileError([file("ok.webp", "image/webp")], "image", "Imagen")).toBeNull();
  });

  it("el atributo accept coincide con los formatos admitidos", () => {
    expect(FILE_ACCEPT.image).toContain("image/webp");
    expect(FILE_ACCEPT.pdf).toBe("application/pdf,.pdf");
  });
});
