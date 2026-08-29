// Único punto que lee VITE_REHNIMARKET_WHATSAPP y arma la URL de wa.me.
// Devuelve null (no lanza) si la variable no está configurada, para que el caller avise.
export function buildRechargeWhatsappUrl(params: {
  amount: number;
  userName: string;
  userEmail: string;
}): string | null {
  const rawNumber = import.meta.env.VITE_REHNIMARKET_WHATSAPP;

  if (!rawNumber) return null;

  // wa.me solo acepta dígitos: se limpian "+", espacios y guiones.
  const number = rawNumber.replace(/\D/g, "");

  if (!number) return null;

  // Cantidad sin símbolo de moneda: es un mensaje leído por una persona.
  const message = [
    `Hola, soy ${params.userName}.`,
    "Quiero solicitar una recarga de RehniCoins.",
    "",
    `Cantidad solicitada: ${params.amount.toLocaleString("es-CO")} RehniCoins`,
    "",
    "Correo de mi cuenta:",
    params.userEmail,
    "",
    "Quedo atento para completar el proceso de pago.",
  ].join("\n");

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
