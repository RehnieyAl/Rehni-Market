/** Descripción pública de la tienda con su texto por defecto cuando la empresa no la ha escrito. */
export default function CompanyDescription({ description }: { description: string | null }) {
  return description ? (
    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-muted">{description}</p>
  ) : (
    <p className="mt-3 text-sm text-gray-400">Esta tienda todavía no agregó una descripción.</p>
  );
}
