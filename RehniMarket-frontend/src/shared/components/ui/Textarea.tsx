import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/shared/utils/cn";
import FormField, { type FieldShellProps } from "./FormField";
import { controlClasses } from "./controlClasses";

interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className">,
    FieldShellProps {
  textareaClassName?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, required, className, textareaClassName, rows = 4, ...props },
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
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={cn(controlClasses(invalid), "h-auto resize-none px-4 py-3", textareaClassName)}
          {...props}
        />
      )}
    />
  );
});

export default Textarea;
