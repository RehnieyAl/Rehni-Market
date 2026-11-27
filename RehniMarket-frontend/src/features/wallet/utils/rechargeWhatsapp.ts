/** Enlace de WhatsApp para pedir una recarga de RehniCoin al número público institucional. El mensaje es
 * fijo y no lleva datos de la cuenta: el equipo identifica al comprador durante la conversación. */

export const RECHARGE_MESSAGE =
  "Hola, equipo de RehniMarket. Quiero solicitar una recarga de RehniCoin para mi cuenta. ¿Podrían indicarme cómo continuar?";

/**
 * Número en formato internacional para wa.me (solo dígitos, con prefijo de país) o null si no es seguro
 * usarlo. Solo se acepta un número que empiece con "+": sin él el prefijo de país sería una suposición.
 */
export function toWhatsappNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const compact = phone.replace(/[\s().-]/g, "");
  if (!/^\+[1-9][0-9]{7,14}$/.test(compact)) return null;
  return compact.slice(1);
}

export function buildRechargeWhatsappUrl(phone: string | null | undefined): string | null {
  const number = toWhatsappNumber(phone);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(RECHARGE_MESSAGE)}` : null;
}
