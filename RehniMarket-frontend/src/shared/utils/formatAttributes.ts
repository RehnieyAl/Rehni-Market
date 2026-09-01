export interface AttributePair {
  attribute: string;
  value: string;
}

export function formatAttributePairs(
  pairs: AttributePair[] | Record<string, string> | null | undefined,
): string {
  if (!pairs) return "";

  const entries = Array.isArray(pairs)
    ? pairs.map((pair) => [pair.attribute, pair.value] as const)
    : Object.entries(pairs);

  return entries
    .filter(([, value]) => value)
    .map(([name, value]) => `${name}: ${value}`)
    .join(" · ");
}
