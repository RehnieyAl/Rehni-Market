// Une clases condicionalmente. No hace merge de Tailwind (no hay tailwind-merge):
// quien llama debe pasar clases que no colisionen entre sí.
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
