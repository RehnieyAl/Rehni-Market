// Único punto del proyecto que lee VITE_REHNIMARKET_WHATSAPP (ver
// .env.example) - ni RechargeRequestModal.tsx ni ningún otro componente
// escriben el número o arman la URL a mano (ver ALCANCE > FASE 7). El
// mismo patrón que ya usa src/api/Client.ts para VITE_API_URL:
// import.meta.env.VITE_X leído directo en el punto de uso, sin
// configuración centralizada adicional (el proyecto no tiene una).
//
// Devuelve `null` (en vez de lanzar) cuando la variable no está
// configurada, para que el caller decida cómo avisarlo por el sistema
// global de alertas en vez de abrir una URL inválida (ver ALCANCE >
// FASE 16, "variable de entorno no configurada").
export function buildRechargeWhatsappUrl(params: {
  amount: number;
  userName: string;
  userEmail: string;
}): string | null {
  const rawNumber = import.meta.env.VITE_REHNIMARKET_WHATSAPP;

  if (!rawNumber) return null;

  // wa.me solo acepta dígitos (sin "+", espacios ni guiones) - se limpia
  // acá por si la variable de entorno se cargó con ese formato.
  const number = rawNumber.replace(/\D/g, "");

  if (!number) return null;

  // Mismo texto de referencia del enunciado (ver ALCANCE > FASE 8):
  // cantidad sin símbolo de moneda ("$"), porque es un mensaje leído por
  // una persona, no una cifra en pantalla (ahí sí se usa formatPrice, ver
  // Wallet.tsx/RechargeRequestModal.tsx).
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
