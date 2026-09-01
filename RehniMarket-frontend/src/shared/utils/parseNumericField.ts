export function parseNumericField(
  value: string,
  { integer = false }: { integer?: boolean } = {},
): number | null {
  const trimmed = value.trim();

  if (trimmed === "") return null;

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed)) return null;

  if (integer && !Number.isInteger(parsed)) return null;

  return parsed;
}
