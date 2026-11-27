/** Límites de los textos de una reclamación; son los mismos que valida el backend (SchemaReturn.py). */
export const RETURN_TEXT_MIN = 5;
export const RETURN_TEXT_MAX = 500;
export const ADMIN_TEXT_MAX = 2000;
export const RETURN_SUBJECT_MIN = 5;
export const RETURN_SUBJECT_MAX = 150;

export function textError(value: string, label: string, max = RETURN_TEXT_MAX): string | undefined {
  const length = value.trim().length;
  if (length < RETURN_TEXT_MIN) return `${label}: escribe al menos ${RETURN_TEXT_MIN} caracteres.`;
  if (length > max) return `${label}: máximo ${max} caracteres.`;
  return undefined;
}

export function subjectError(value: string): string | undefined {
  const length = value.trim().length;
  if (length < RETURN_SUBJECT_MIN) return `El asunto debe tener al menos ${RETURN_SUBJECT_MIN} caracteres.`;
  if (length > RETURN_SUBJECT_MAX) return `El asunto no debe exceder los ${RETURN_SUBJECT_MAX} caracteres.`;
  return undefined;
}
