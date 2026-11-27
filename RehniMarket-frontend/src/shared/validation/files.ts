// Espejo de RehniMarket-backend/app/utils/FileValidator.py: mismos formatos y límite de 5 MiB.
// El backend además revisa el contenido real; aquí se evita enviar lo que sabemos que rechazará.

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export type FileKind = "image" | "pdf";

const RULES: Record<FileKind, { extensions: string[]; types: string[]; names: string }> = {
  image: {
    extensions: ["jpg", "jpeg", "png", "webp"],
    types: ["image/jpeg", "image/png", "image/webp"],
    names: "JPEG, PNG, WEBP",
  },
  pdf: { extensions: ["pdf"], types: ["application/pdf"], names: "PDF" },
};

export const FILE_ACCEPT: Record<FileKind, string> = {
  image: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
  pdf: "application/pdf,.pdf",
};

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

export function validateFile(file: File, kind: FileKind, label: string): string | null {
  const rule = RULES[kind];

  if (!rule.extensions.includes(extensionOf(file.name)) || !rule.types.includes(file.type)) {
    return `${label}: solo se admite ${rule.names}.`;
  }

  if (file.size === 0) return `${label}: el archivo está vacío.`;

  if (file.size > MAX_UPLOAD_BYTES) return `${label}: el archivo supera el máximo de 5 MB.`;

  return null;
}

export function firstFileError(files: Iterable<File>, kind: FileKind, label: string): string | null {
  for (const file of files) {
    const error = validateFile(file, kind, label);
    if (error) return error;
  }
  return null;
}
