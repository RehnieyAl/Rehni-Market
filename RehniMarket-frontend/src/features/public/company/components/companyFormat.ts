/** Formatos compartidos del perfil de empresa: conteos en plural y fecha "Desde mes de año". */
export function pluralize(count: number, singular: string, plural: string): string {
  return `${count.toLocaleString("es-CO")} ${count === 1 ? singular : plural}`;
}

export function formatMemberSince(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString("es-CO", { year: "numeric", month: "long" });
}
