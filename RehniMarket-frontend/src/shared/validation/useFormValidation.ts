import { useCallback, useState } from "react";
import type { z } from "zod";

export type FieldErrors = Record<string, string>;

/** Primer mensaje de cada campo (el backend también informa uno por campo). */
export function getFieldErrors(schema: z.ZodType, values: unknown): FieldErrors {
  const result = schema.safeParse(values);
  if (result.success) return {};

  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "");
    if (!(key in errors)) errors[key] = issue.message;
  }
  return errors;
}

/**
 * Validación en vivo con un esquema zod sobre estado controlado.
 *
 * Un campo muestra su error al perder el foco (`touch`) y desde ahí en cada
 * cambio; `validateAll` (en el submit) los muestra todos y dice si se puede enviar.
 */
export function useFormValidation(schema: z.ZodType, values: unknown) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const errors = getFieldErrors(schema, values);
  const isValid = Object.keys(errors).length === 0;

  const touch = useCallback((name: string) => {
    setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
  }, []);

  const errorFor = (name: string) =>
    submitted || touched[name] ? errors[name] : undefined;

  const validateAll = () => {
    setSubmitted(true);
    return isValid;
  };

  const reset = useCallback(() => {
    setTouched({});
    setSubmitted(false);
  }, []);

  return { errors, isValid, errorFor, touch, validateAll, reset };
}
