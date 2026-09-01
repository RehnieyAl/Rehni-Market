import type { DiscountInput, DiscountType } from "@/features/company/types/request";

export interface DiscountFormState {
  enabled: boolean;
  type: DiscountType;
  value: string;
  startsAt: string;
  endsAt: string;
}

interface DiscountSource {
  discount_enable: boolean;
  discount_value: string | number;
  discount_type: string | null;
  discount_starts_at: string | null;
  discount_ends_at: string | null;
}

function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function localInputToIso(local: string): string | null {
  if (!local) return null;
  const date = new Date(local);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function discountToLocalState(source: DiscountSource | null): DiscountFormState {
  if (!source) {
    return { enabled: false, type: "percent", value: "", startsAt: "", endsAt: "" };
  }

  const rawValue = Number(source.discount_value);

  return {
    enabled: source.discount_enable,
    type: source.discount_type === "fixed" ? "fixed" : "percent",
    value: source.discount_enable && rawValue > 0 ? String(rawValue) : "",
    startsAt: isoToLocalInput(source.discount_starts_at),
    endsAt: isoToLocalInput(source.discount_ends_at),
  };
}

export function localStateToDiscountInput(
  state: DiscountFormState,
): { value: DiscountInput } | { error: string } {
  if (!state.enabled) {
    return {
      value: {
        discount_enable: false,
        discount_value: 0,
        discount_type: null,
        discount_starts_at: null,
        discount_ends_at: null,
      },
    };
  }

  const value = Number(state.value);

  if (!Number.isFinite(value) || value <= 0) {
    return { error: "Para activar el descuento, ingresa un valor mayor a 0." };
  }

  if (state.type === "percent" && value > 100) {
    return { error: "El porcentaje de descuento no puede superar 100." };
  }

  const startsAt = localInputToIso(state.startsAt);
  const endsAt = localInputToIso(state.endsAt);

  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
    return { error: "La fecha de fin debe ser posterior a la de inicio." };
  }

  return {
    value: {
      discount_enable: true,
      discount_value: value,
      discount_type: state.type,
      discount_starts_at: startsAt,
      discount_ends_at: endsAt,
    },
  };
}
