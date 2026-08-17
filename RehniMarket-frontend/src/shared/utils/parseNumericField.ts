// Convierte el valor crudo de un input numérico (type="text" +
// inputMode="numeric" - ver ProductForm.tsx / ProductEdit.tsx /
// VariantModal.tsx) a un número válido, de forma segura.
//
// Nunca devuelve NaN/Infinity: si el texto no es un número finito, o si
// `integer: true` y el número no es entero, devuelve `null` para que el
// formulario lo rechace con un mensaje amigable ANTES de enviarlo (ver
// ValueError: "Out of range float values are not JSON compliant: nan").
//
// A propósito no se usa parseFloat/parseInt para la validación: ambos son
// permisivos con sufijos inválidos (parseFloat("12abc") -> 12), lo que
// aceptaría en silencio un typo del usuario. Number() es estricto -
// rechaza cualquier caracter que no forme parte de un número válido -, y
// es el único punto de verdad aquí.
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
