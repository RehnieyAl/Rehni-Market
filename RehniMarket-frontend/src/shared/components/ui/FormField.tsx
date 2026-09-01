import { useId } from "react";
import type { ReactNode } from "react";

import { cn } from "@/shared/utils/cn";

export interface FieldShellProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
}

export default function FormField({
  label,
  hint,
  error,
  required,
  className,
  render,
}: FieldShellProps & {
  render: (ids: {
    id: string;
    describedBy: string | undefined;
    invalid: boolean;
  }) => ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const invalid = Boolean(error);
  const describedBy =
    cn(hint ? hintId : undefined, error ? errorId : undefined) || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}

      {render({ id, describedBy, invalid })}

      {hint && !error && (
        <p id={hintId} className="text-xs text-gray-400">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
