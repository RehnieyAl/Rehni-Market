export function buildRechargeWhatsappUrl(params: {
  amount: number;
  userName: string;
  userEmail: string;
}): string | null {
  const rawNumber = import.meta.env.VITE_REHNIMARKET_WHATSAPP;

  if (!rawNumber) return null;

  const number = rawNumber.replace(/\D/g, "");

  if (!number) return null;

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
