import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/utils/cn";
import FormField, { type FieldShellProps } from "./FormField";
import { controlClasses } from "./controlClasses";

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "className">,
    FieldShellProps {
  leadingIcon?: ReactNode;
  trailingSlot?: ReactNode;
  inputClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    required,
    className,
    leadingIcon,
    trailingSlot,
    inputClassName,
    disabled,
    ...props
  },
  ref,
) {
  return (
    <FormField
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
      render={({ id, describedBy, invalid }) => (
        <div className="relative">
          {leadingIcon && (
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              {leadingIcon}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            disabled={disabled}
            className={cn(
              controlClasses(invalid),
              leadingIcon ? "pl-11" : "px-4",
              trailingSlot ? "pr-11" : leadingIcon ? "pr-4" : "",
              inputClassName,
            )}
            {...props}
          />

          {trailingSlot && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500">
              {trailingSlot}
            </span>
          )}
        </div>
      )}
    />
  );
});

export default Input;
