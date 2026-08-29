import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/shared/utils/cn";
import FormField, { type FieldShellProps } from "./FormField";
import { controlClasses } from "./controlClasses";

interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "className">,
    FieldShellProps {
  selectClassName?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, required, className, selectClassName, children, ...props },
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
          <select
            ref={ref}
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={cn(
              controlClasses(invalid),
              "cursor-pointer appearance-none px-4 pr-10",
              selectClassName,
            )}
            {...props}
          >
            {children}
          </select>

          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>
      )}
    />
  );
});

export default Select;
