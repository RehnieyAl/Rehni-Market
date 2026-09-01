import { useEffect, useRef } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";

import { cn } from "@/shared/utils/cn";

interface OtpInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  length?: number;
  disabled?: boolean;
  autoFocusKey?: number;
  ariaLabel?: string;
}

export default function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocusKey,
  ariaLabel = "Código de verificación",
}: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocusKey === undefined) return;
    inputs.current[0]?.focus();
  }, [autoFocusKey]);

  const setDigit = (raw: string, index: number) => {
    if (!/^\d?$/.test(raw)) return;

    const next = [...value];
    next[index] = raw;
    onChange(next);

    if (raw && index < length - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === "Backspace" && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!digits) return;

    event.preventDefault();
    const next = Array.from({ length }, (_, i) => digits[i] ?? "");
    onChange(next);
    inputs.current[Math.min(digits.length, length - 1)]?.focus();
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="grid grid-cols-6 gap-1.5 sm:gap-2.5"
    >
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          aria-label={`Dígito ${index + 1} de ${length}`}
          value={value[index] ?? ""}
          onChange={(event) => setDigit(event.target.value, index)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          onPaste={handlePaste}
          className={cn(
            "h-12 w-full rounded-control border border-gray-300 text-center text-lg font-bold text-gray-900 outline-none transition",
            "focus:border-brand-600 focus:ring-2 focus:ring-brand-600/25 sm:h-14 sm:text-xl",
            "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400",
          )}
        />
      ))}
    </div>
  );
}
