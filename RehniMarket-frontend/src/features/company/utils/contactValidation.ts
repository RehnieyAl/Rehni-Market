/** Validación del contacto empresarial de Mi tienda (mismas reglas que UpdateInformationCompanyRequest). */
interface ContactValues {
  contactEmail: string;
  contactPhone: string;
}

/** Vacío es válido y borra el dato. */
export function contactErrors(values: ContactValues): { contactEmail?: string; contactPhone?: string } {
  const email = values.contactEmail.trim();
  const phone = values.contactPhone.replace(/[\s-]/g, "");
  return {
    contactEmail: email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? "Escribe un correo de contacto válido." : undefined,
    contactPhone: phone && !/^\+?\d{7,15}$/.test(phone) ? "El teléfono de contacto debe tener entre 7 y 15 dígitos." : undefined,
  };
}
