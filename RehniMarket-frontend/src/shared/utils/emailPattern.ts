/** Patrón de correo de contacto de la web: mismas reglas que el backend (ShemaCompany.validate_contact_email). */

// Acepta lo mismo que /^[^@\s]+@[^@\s]+\.[^@\s]+$/, pero sin que el punto pueda consumirse de dos formas:
// aquella retrocedía de forma cuadrática (≈1,6 s con 50 000 caracteres malformados) y congelaba el formulario.
export const CONTACT_EMAIL_PATTERN = /^[^@\s]+@[^@\s][^@\s.]*\.[^@\s]+$/;
