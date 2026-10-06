import { formatPrice } from "@/shared/utils/formatPrice";

/**
 * Máximo por OPERACIÓN de recarga administrativa (admin/owner). Aplica a la
 * recarga y a la cantidad final de una corrección. NO es un tope de saldo total.
 * El backend lo valida con app/core/WalletConfig.MAX_ADMIN_RECHARGE_AMOUNT.
 */
export const MAX_ADMIN_RECHARGE_AMOUNT = 10_000_000;

/** Etiqueta del límite, formato COP ($10.000.000). */
export const MAX_ADMIN_RECHARGE_AMOUNT_LABEL = formatPrice(MAX_ADMIN_RECHARGE_AMOUNT);

/** Mismo texto que devuelve el backend para una cantidad por encima del tope. */
export const MAX_ADMIN_RECHARGE_MESSAGE = `El monto máximo de recarga es de ${MAX_ADMIN_RECHARGE_AMOUNT_LABEL}.`;
