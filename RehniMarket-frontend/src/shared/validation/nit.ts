// Espejo de RehniMarket-backend/app/utils/NitValidator.py (algoritmo DIAN,
// módulo 11 con pesos primos). Mantener ambos en sincronía.

const DV_WEIGHTS = [71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3];

export function cleanNit(nit: string): string {
  return (nit ?? "").replace(/\D/g, "");
}

/** Dígito de verificación de un NIT compuesto solo por dígitos. */
export function calculateNitDv(nit: string): number {
  const padded = nit.padStart(15, "0");

  // Como zip() en Python: solo se ponderan los primeros 15 dígitos (ver H-02).
  let total = 0;
  for (let i = 0; i < DV_WEIGHTS.length; i++) {
    total += Number(padded[i]) * DV_WEIGHTS[i];
  }

  const remainder = total % 11;

  return remainder === 0 || remainder === 1 ? remainder : 11 - remainder;
}

export function isValidNitDv(nit: string, dv: string): boolean {
  const digits = cleanNit(nit);

  if (!digits || !/^[0-9]+$/.test(dv)) return false;

  return calculateNitDv(digits) === Number(dv);
}
